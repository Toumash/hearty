
const MongoClient = require('mongodb').MongoClient;

let cachedDb = null

async function connectToDatabase(uri) {
  if (cachedDb) 
    return cachedDb
    
  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true});
  const db = await client.db("test");
  cachedDb = db;
  return db;
}

module.exports = async (req, res) => {
  // Get a database connection, cached or otherwise,
  // using the connection string environment variable as the argument
  const db = await connectToDatabase(process.env.MONGODB_URI)

  // Select the "users" collection from the database
  const collection = await db.collection('users')

  // Select the users collection from the database
  const users = await collection.find({}).toArray()

  // Respond with a JSON string of all users in the collection
  res.status(200).json({ users })
}