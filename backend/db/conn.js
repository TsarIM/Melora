import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString);

let db = null;

try {
  const conn = await client.connect();
  db = conn.db("piano_app"); // Changed from sample_mflix
  console.log("✅ MongoDB connected");
} catch (e) {
  console.error("❌ MongoDB connection failed:", e.message);
}

export default db;
