import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import mongoose from "mongoose";

export async function GET() {
  await connectDB();

  const db = mongoose.connection.db as mongoose.mongo.Db;
  const result = await db.collection("shops").dropIndex("owner_1_link_1");

  return NextResponse.json({ success: true, result });
}


