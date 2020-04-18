"use strict";

const express = require("express");
const socketIO = require("socket.io");
const push = require("web-push");
const uuid = require("uuid");
const cookieParser = require("cookie-parser");

let environment = process.env.NODE_ENV || "dev";
require("dotenv").config({ path: `.env.${environment}` });
const sql = require('./sql');


const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:" + PORT;
push.setVapidDetails("mailto:hearty@example.com", process.env.VAPID_PUB, process.env.VAPID_PRIV);

const guid = () => uuid.v4();
const auth = (req, res, next) => {
  if (!res.locals.user) {
    return res.status(401).end();
  }
  next();
}

const server = express()
  .use(express.static("public"))
  .use(express.json())
  .set("view engine", "ejs")
  .use(cookieParser())
  .get("/api/healthz/readiness", (req, res) => res.status(200).json({ status: "ok" }).end())
  .use(async (req, res, next) => {
    let dbUser = null;
    if (!req.cookies.user) {
      let userId = guid();
      res.cookie("user", userId);
      res.locals.userId = userId;
      dbUser = { subscription: null, inviteCode: null, partnerId: null, _id: userId };
      sql.addUser(dbUser);
    } else {
      res.locals.userId = req.cookies.user;
    }
    if (dbUser == null) {
      dbUser = await sql.getUser(res.locals.userId);
      if (dbUser == null) {
        let userId = guid();
        res.cookie("user", userId);
        res.locals.userId = userId;
        dbUser = { subscription: null, inviteCode: null, partnerId: null, _id: userId };
        sql.addUser(dbUser);
      }
    }
    res.locals.user = dbUser;

    next()
  })
  .get('/api/user/invite-link', [auth, async (req, res) => {
    let inviteCode = '';
    if (!res.locals.user.inviteCode) {
      inviteCode = Buffer.from(guid()).toString('base64');
      let user = res.locals.user;
      user.inviteCode = inviteCode;
      await sql.updateUser(user);
    }
    else
      inviteCode = res.locals.user.inviteCode;

    let inviteLink = PUBLIC_URL + '/user/accept-invite/' + inviteCode;
    res.json({ inviteLink: inviteLink, inviteCode: inviteCode }).end();
  }])
  .post('/api/accept-invite/:invitationCode', [auth, async (req, res) => {
    let currentUser = res.locals.user;
    console.log('hello,', currentUser)
    let currentUserId = res.locals.userId;
    let invitationCode = req.params.invitationCode;

    if (currentUser.inviteCode == invitationCode) {
      res.status(500).json({ status: 'error', message: 'invalid action. You can\'t invite yourself' }).end();
      return;
    }

    let users = await sql.getAllUsers();
    let partnerUser = users.find(u => u.invitationCode == invitationCode);
    if (partnerUser == null) {
      res.status(404).json({ status: 'error', message: 'invitation code does not exist in the database' }).end();
      return;
    }
    let partnerUserId = partneerUser._id;
    let user = res.locals.user;
    user.partnerId = partnerUserId;
    await sql.updateUser(user);
    partnerUser.partnerId = currentUserId;
    await sql.getUser(partnerUser);
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
    let user = res.locals.user;
    user.subscription = req.body;
    sql.updateUser(user);
    res.status(201).end();
  })
  .get("/", (req, res) => {
    res.render("pages/index", {
      userId: req.cookies.user,
      webpush_key: process.env.VAPID_PUB,
      hasPartner: res.locals.user.partnerId != null
    });
  })
  .post('/api/send-love', [auth, async (req, res) => {
    let user = res.locals.user;
    let users = await sql.getAllUsers();
    let partner = users.find(u => u.partnerId == user.partnerId);
    if (partner == null) { return res.status(400).json({ status: 'error', message: 'no partner found for this user' }).end(); }
    let pushNotifySubscriptionKeys = partner.subscription;
    push.sendNotification(pushNotifySubscriptionKeys);
    await sql.logEvent('LOVE_SENT', `user ${user._id} sent a love letter to ${partner._id}`);
    res.status(201).json({ status: 'ok', description: 'message sent!' }).end();
  }])
  .get("/receive-love", (req, res) => {
    res.render("pages/receive-love", {
      userId: res.locals.userId,
      webpush_key: process.env.VAPID_PUB
    });
  })
  .get('/user/accept-invite/:invitationCode', async (req, res) => {
    let inviteCode = req.params.invitationCode;

    let users = await sql.getAllUsers();
    let user = users.find(u => u.inviteCode == inviteCode);
    if (user == null) {
      res.status(404)
        .json({ status: 'error', messsage: 'Invitation link already used or does not exist' })
        .end();
      return;
    }

    res.render("pages/accept-invite", {
      userId: req.cookies.user,
      webpush_key: process.env.VAPID_PUB,
      inviteCode: inviteCode
    });
  })
  .get("/api/db", async (req, res) => {
    if (environment !== 'dev') {
      res.status(403).json({ status: 'error', message: 'database is only accessible in dev environment' }).end();
      return;
    }
    res.json(await sql.getAllUsers());
  })
  .listen(PORT, () => console.log(`Started http://localhost:${PORT}`));

const io = socketIO(server);

io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

setInterval(() => io.emit("time", new Date().toTimeString()), 1000);

