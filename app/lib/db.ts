// app/lib/db.ts
import mongoose from "mongoose";

declare global {
  // for Next.js hot reload & serverless environments
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConnection) return global._mongooseConnection;

  const MONGO_URI = process.env.MONGO_URI as string;
  if (!MONGO_URI) {
    throw new Error("❌ MONGO_URI not set in environment variables");
  }

  // ✅ Connection options tuned for speed & stability
  const opts = {
    dbName: process.env.MONGO_DB_NAME || undefined,
    bufferCommands: false,
    maxPoolSize: 10, // limit connections to reduce overhead
    minPoolSize: 2,  // keep small pool alive for reuse
    serverSelectionTimeoutMS: 5000, // fail fast if not available
    socketTimeoutMS: 45000, // disconnect slow connections
    family: 4, // use IPv4 for speed in some environments
  };

  // ✅ Cache the connection promise globally
  global._mongooseConnection = mongoose
    .connect(MONGO_URI, opts)
    .then((m) => {
      console.log("✅ MongoDB Connected");
      return m;
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err);
      delete global._mongooseConnection;
      throw err;
    });

  return global._mongooseConnection;
}



