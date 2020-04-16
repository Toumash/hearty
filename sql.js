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
async function users() {
  const db = await connectToDatabase(process.env.MONGODB_URI);
  const collection = await db.collection("users");
  return collection;
}

async function getUser(id) {
  const users = await users();
  return await users.find({ _id: id }).toArray().shift();
}
async function getAllUsers() {
  const users = await users();
  return await users.find({}).toArray();
}

async function addUser(user) {
  const users = await users();
  return await users.insertOne(user);
}

async function updateUser(user) {
  const users = await users();
  return await users.replaceOne({ _id: user.id }, user);
}
