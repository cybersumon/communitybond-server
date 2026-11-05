
import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";
import { env } from "./env.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);


const client = new MongoClient(env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});


let database: Db | null = null;


export async function connectDatabase(): Promise<Db> {
  await client.connect();


  await client.db("admin").command({ ping: 1 });

  database = client.db(env.DB_NAME);

  console.log("MongoDB connected successfully");

  return database;
}


export function getDatabase(): Db {
  if (!database) {
    throw new Error("Database is not connected.");
  }

  return database;
}

export async function closeDatabase(): Promise<void> {
  await client.close();
  database = null;
}
