// app/api/shop/[link]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";

export async function GET(request: Request, { params }: { params: { link: string } }) {
  await connectDB();

  const { link } = params;

  try {
    const shop = await Shop.findOne({ link });
    if (!shop) return NextResponse.json({ message: "Shop not found" }, { status: 404 });

    return NextResponse.json(shop);
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
