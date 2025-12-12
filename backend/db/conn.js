import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
console.log("URI = ",process.env.MONGO_URI);
const client = new MongoClient(process.env.MONGO_URI);

let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db("testdb");
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
  }
}

export function getDB() {
  return db;
}