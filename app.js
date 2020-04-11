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

let db = { users: {}, invitation: {} };
const getUserId = (req) => req.cookies.user.id;
const checkAuth = (req) => db.users[getUserId(req)];

const server = express()
  .use(express.json())
  .set("view engine", "ejs")
  .use(cookieParser())
  .use("/api/healthz/readiness", (req, res) => {
    res.status(200).json({ status: "ok" });
  })
  .post("/api/subscription", (req, res) => {
    if (!db.users[getUserId(req)])
      db.users[getUserId(req)] = { subscription: req.body };
    res.status(201).end();
  })
  .post("/api/invitation", (req, res) => {
    if (!checkAuth(req)) return res.status(401).end();

    let inviteId = guid();
    let invite = { inviteId: inviteId, userId: getUserId(req) };
    db.invitation.push(invite);
    res.status(201).json(invite).end();
  })
  .get("/api/database", (req, res) => {
    if(!checkAuth(req)) { return res.status(401).end();}
    res.json(db);
  })
  .post('/api/user',(req,res)=>{
    let user = req.cookies.user;
    if (!user) {
      user = { id: guid() };
      res.cookie("user", user);
    }
    res.status(201).json(user).end();
  })
  .use("/api/user", async (req, res) => {
    const db = await connectToDatabase(process.env.MONGODB_URI);
    const collection = await db.collection("users");
    const users = await collection.find({}).toArray();
    res.status(200).json({ users });
  })
  .get("/", (req, res) => {
    let user = req.cookies.user;
    if (!user) {
      user = { id: guid() };
      res.cookie("user", user);
    }
    res.render("pages/index", {
      userId: user.id,
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
