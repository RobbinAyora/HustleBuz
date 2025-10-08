import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export async function GET(req: Request) {
  try {
    await connectDB();

    // ✅ Extract JWT token from cookies
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      ?.find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Token not found in cookies" },
        { status: 401 }
      );
    }

    // ✅ Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const vendorId = decoded.id;

    // ✅ Fetch orders that belong to this vendor
    const orders = await Order.find({ "items.vendor": vendorId })
      .populate("items.product", "name price")
      .populate("items.vendor", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("🔥 GET vendor orders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}


