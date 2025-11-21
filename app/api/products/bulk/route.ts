import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";

export async function POST(req: Request) {
  await connectDB();
  const { ids } = await req.json();

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  }

  const products = await Product.find({ _id: { $in: ids } });
  return NextResponse.json(products);
}
