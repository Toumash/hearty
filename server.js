'use strict';

const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const socketIO = require('socket.io');


let cachedDb = null

async function connectToDatabase(uri) {
  if (cachedDb) 
    return cachedDb
    
  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true});
  const db = await client.db("test");
  cachedDb = db;
  return db;
}

let testFn = async (req, res) => {
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

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static('public'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);