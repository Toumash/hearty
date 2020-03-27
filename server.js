'use strict';

const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const socketIO = require('socket.io');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })


let cachedDb = null

async function connectToDatabase(uri) {
  if (cachedDb) 
    return cachedDb
    
  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true});
  const db = await client.db("test");
  cachedDb = db;
  return db;
}

const PORT = process.env.PORT || 3000;

const server = express()
  .use('/api/healthz/readiness',(req,res)=>{
    res.status(200).json({ status:'ok'})
  })
  .use('/api/users',async (req,res)=>{
    console.log(process.env.MONGODB_URI);
    const db = await connectToDatabase(process.env.MONGODB_URI)
    const collection = await db.collection('users')
    const users = await collection.find({}).toArray()
    res.status(200).json({ users })
  })
  .use(express.static('public'))
  .listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);