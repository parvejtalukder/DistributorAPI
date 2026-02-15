const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('BusDb'); 
    console.log('MongoDB connected');
    return db;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call connectDB first.');
  return db;
}

module.exports = { connectDB, getDB };
