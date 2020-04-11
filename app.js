"use strict";

const MongoClient = require("mongodb").MongoClient;
const express = require("express");
const socketIO = require("socket.io");
const push = require("web-push");
const uuid = require("uuid");
const cookieParser = require("cookie-parser");

let environment = process.env.NODE_ENV || "dev";
require("dotenv").config({ path: `.env.${environment}` });

const PORT = process.env.PORT || 3000;
const PUBLIC_URL = "http://localhost:" + PORT;

push.setVapidDetails(
  "mailto:hearty@example.com",
  process.env.VAPID_PUB,
  process.env.VAPID_PRIV
);

let cachedDb = null;
async function connectToDatabase(uri) {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db = await client.db("test");
  cachedDb = db;
  return db;
}
const guid = () => uuid.v4();

let db = { user: {} };
const getUserId = (req) => req.cookies.user;
const getUser = (req) => db.user[getUserId(req)];

const server = express()
  .use(express.json())
  .set("view engine", "ejs")
  .use(cookieParser())
  .use("/api/healthz/readiness", (req, res) => {
    res.status(200).json({ status: "ok" });
  })
  .get('/api/user/invite-link', (req, res) => {
    if (!getUser(req)) { return res.status(401).end(); }

    let inviteCode = '';
    if (!getUser(req).inviteCode)
      inviteCode = Buffer.from(guid()).toString('base64');
    else
      inviteCode = getUser(req).inviteCode;

    let inviteLink = PUBLIC_URL + '/user/accept-invite/' + inviteCode;

    let user = getUser(req);
    user.inviteCode = inviteCode;
    res.json({ inviteLink: inviteLink }).end();
  })
  .get('/user/accept-invite/:invitationCode', (req, res) => {
    let invitationCode = req.params.invitationCode;
    let userId = Object.keys(db.user).find(userId => db.user[userId].inviteCode == invitationCode);
    if (userId == null) {
      res.status(404)
        .json({ status: 'error', messsage: 'Invitation link already used or does not exist' });
    }

    res.status(200).json({ status: 'ok', message: 'NOT IMPLEMENTED. THERE SHOULD BE FRONTEND HERE' })
    console.log(invitationCode);
    // TODO: frontend page render
  })
  .post("/api/user", (req, res) => {
    if (!db.user[getUserId(req)])
      db.user[getUserId(req)] = { subscription: req.body };
    res.status(201).end();
  })
  .get("/api/user", async (req, res) => {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const collection = await db.collection("users");
    const users = await collection.find({}).toArray();
    res.status(200).json({ users });
  })
  .get("/api/db", (req, res) => {
    if (!getUser(req)) { return res.status(401).end(); }
    res.json(db);
  })
  .get("/", (req, res) => {
    let user = req.cookies.user;
    if (!user) {
      user = guid();
      res.cookie("user", user);
    }
    res.render("pages/index", {
      userId: user,
      webpush_key: process.env.VAPID_PUB
    });
  })
  .get("/receive-love", (req, res) => {
    res.render("pages/receive-love", {
      userId: req.cookies.user,
      webpush_key: process.env.VAPID_PUB
    });
  })

  .use(express.static("public"))
  .listen(PORT, () => console.log(`Started http://localhost:${PORT}`));

const io = socketIO(server);

io.on("connection", socket => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

setInterval(() => io.emit("time", new Date().toTimeString()), 1000);
