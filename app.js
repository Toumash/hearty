"use strict";

const express = require("express");
const socketIO = require("socket.io");
const push = require("web-push");
const uuid = require("uuid");
const cookieParser = require("cookie-parser");

let environment = process.env.NODE_ENV || "dev";
require("dotenv").config({ path: `.env.${environment}` });

const PORT = process.env.PORT || 3000;
const PUBLIC_URL = "http://localhost:" + PORT;
push.setVapidDetails("mailto:hearty@example.com", process.env.VAPID_PUB, process.env.VAPID_PRIV);


let db = { user: { "test": { subscription: {},partnerId:'alicja'} } };
const getUserId = (req) => req.cookies.user;
const getUser = (req) => db.user[getUserId(req)];
const guid = () => uuid.v4();
const auth = (req, res, next) => {
  let user = getUser(req);
  if (!user) {
    return res.status(401).end();
  }
  res.locals.user = user;
  next();
}

const server = express()
  .use(express.json())
  .set("view engine", "ejs")
  .use(cookieParser())
  .get("/api/healthz/readiness", (req, res) => res.status(200).json({ status: "ok" }).end())
  .use((req, res, next) => {
    if (!req.cookies.user)
      res.cookie("user", guid());
    next()
  })
  .get('/api/user/invite-link', [auth, (req, res) => {
    let inviteCode = '';
    if (!getUser(req).inviteCode)
      inviteCode = Buffer.from(guid()).toString('base64');
    else
      inviteCode = getUser(req).inviteCode;

    let inviteLink = PUBLIC_URL + '/user/accept-invite/' + inviteCode;

    let user = getUser(req);
    user.inviteCode = inviteCode;
    res.json({ inviteLink: inviteLink, inviteCode: inviteCode }).end();
  }])
  .post('/api/accept-invite/:invitationCode', [auth, (req, res) => {
    let currentUser = getUser(req);
    console.log('hello,', currentUser)
    let currentUserId = getUserId(req);
    let invitationCode = req.params.invitationCode;

    if (currentUser.inviteCode == invitationCode) {
      res.status(500).json({ status: 'error', message: 'invalid action. You can\'t invite yourself' }).end();
      return;
    }

    let partnerUserId = Object.keys(db.user).find(userId => db.user[userId].inviteCode == invitationCode);
    if (partnerUserId == null) {
      res.status(404).json({ status: 'error', message: 'invitation code does not exist in the database' }).end();
      return;
    }
    db.user[partnerUserId].partnerId = currentUserId;
    currentUser.partnerId = partnerUserId;
    res.status(201).json({ status: 'ok' }).end();
  }])
  .get('/api/partner', [auth, (req, res) => {
    let partnerId = res.locals.user.partnerId;
    if (partnerId != null) {
      return res.status(200).json({ status: 'ok', message: 'partner found!' }).end();
    } else
      return res.status(404).json({ status: 'error', message: 'partner not found' }).end();
  }])
  .post("/api/user", (req, res) => {
    // it will always overwrite prevous subscription
    let user = db.user[getUserId(req)] || { subscription: null, inviteCode: null, partnerId: null };
    user.subscription = req.body;
    db.user[getUserId(req)] = user;
    res.status(201).end();
  })
  .get("/", (req, res) => {
    res.render("pages/index", {
      userId: req.cookies.user,
      webpush_key: process.env.VAPID_PUB
    });
  })
  .post('/api/send-love', [auth, (req, res) => {
    let user = getUser(req);
    let partner = db.user[user.partnerId];
    if (partner == null) { return res.status(400).json({ status: 'error', message: 'no partner found for this user' }).end(); }
    let pushNotifySubscriptionKeys = partner.subscription;
    push.sendNotification(pushNotifySubscriptionKeys);
    res.status(201).json({ status: 'ok', description: 'message sent!' }).end();
  }])
  .get("/receive-love", (req, res) => {
    res.render("pages/receive-love", {
      userId: req.cookies.user,
      webpush_key: process.env.VAPID_PUB
    });
  })
  .get('/user/accept-invite/:invitationCode', (req, res) => {
    let invitationCode = req.params.invitationCode;
    let userId = Object.keys(db.user).find(userId => db.user[userId].inviteCode == invitationCode);
    if (userId == null) {
      res.status(404)
        .json({ status: 'error', messsage: 'Invitation link already used or does not exist' })
        .end();
      return;
    }

    res.render("pages/accept-invite", {
      userId: req.cookies.user,
      webpush_key: process.env.VAPID_PUB,
      invitationCode: invitationCode
    });
  })
  .get("/api/db", (req, res) => {
    if (environment !== 'dev') {
      res.status(403).json({ status: 'error', message: 'database is only accessible in dev environment' }).end();
      return;
    }
    res.json(db);
  })
  .use(express.static("public"))
  .listen(PORT, () => console.log(`Started http://localhost:${PORT}`));

const io = socketIO(server);

io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

setInterval(() => io.emit("time", new Date().toTimeString()), 1000);

