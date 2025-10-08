// app/lib/db.ts
import mongoose from "mongoose";

let isConnected = false; // ✅ caching connection state manually

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      // optional tweaks for speed & stability
      dbName: process.env.MONGO_DB_NAME || undefined,
      bufferCommands: false,
    });

    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    throw new Error("Database connection failed");
  }
}


