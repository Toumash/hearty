const MongoClient = require("mongodb").MongoClient;

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

async function get_events() {
  const db = await connectToDatabase(process.env.MONGODB_URI);
  const collection = await db.collection("events");
  return collection;
}

async function get_users() {
  const db = await connectToDatabase(process.env.MONGODB_URI);
  const collection = await db.collection("users");
  return collection;
}

async function getUser(id) {
  const users = await get_users();
  return await users.findOne({ _id: id });;
}
async function getAllUsers() {
  const users = await get_users();
  return await users.find({}).toArray();
}

async function addUser(user) {
  const users = await get_users();
  return await users.insertOne(user);
}

async function updateUser(user) {
  const users = await get_users();
  return await users.replaceOne({ _id: user._id }, user);
}

async function logEvent(eventType, message) {
  const events = await get_events();
  await events.insertOne({ type: eventType, message: message, date: new Date() });
}

module.exports = {
  connectToDatabase, get_users, getUser, getAllUsers, addUser, updateUser, logEvent
};