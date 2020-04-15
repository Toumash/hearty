const MongoClient = require("mongodb").MongoClient;
export async function connectToDatabase(uri) {
    if (cachedDb) return cachedDb;
  
    const client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const db = await client.db("test");
    cachedDb = db;
    return db;
  }