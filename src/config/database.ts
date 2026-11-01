
import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env.js";

/**
 * MongoDB Database Connection
 *
 * PURPOSE:
 * Connect the Express.js backend to MongoDB Atlas.
 *
 * DNS FIX:
 * On some Windows/Node.js installations, the DNS
 * resolver incorrectly points to 127.0.0.1.
 *
 * Use Cloudflare and Google DNS for SRV lookups
 * before the MongoDB client starts connecting.
 */

// Fix DNS resolution for MongoDB Atlas SRV records.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Create one MongoDB client for connection pooling.
const client = new MongoClient(env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});

// Store the connected database.
let database: Db | null = null;

/**
 * Connect to MongoDB Atlas.
 */
export async function connectDatabase(): Promise<Db> {
  await client.connect();

  // Verify that MongoDB is responding.
  await client.db("admin").command({ ping: 1 });

  database = client.db(env.DB_NAME);

  console.log("MongoDB connected successfully");

  return database;
}

/**
 * Return the active database.
 */
export function getDatabase(): Db {
  if (!database) {
    throw new Error("Database is not connected.");
  }

  return database;
}

/**
 * Close the database connection gracefully.
 */
export async function closeDatabase(): Promise<void> {
  await client.close();
  database = null;
}
