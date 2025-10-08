import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import Order from "@/app/models/Order";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export async function POST(req: Request) {
  try {
    console.log("🟦 Checkout request received");

    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB Connected");

    // Parse body
    const body = await req.json();
    const { cartItems } = body;
    console.log("🟨 Request body:", body);

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty cart items" },
        { status: 400 }
      );
    }

    // Authenticate buyer
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    let buyerId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        buyerId = decoded.id;
      } catch {
        console.warn("⚠️ Invalid JWT token");
      }
    }

    // TEMP fallback for testing
    if (!buyerId) {
      buyerId = new mongoose.Types.ObjectId().toString(); // generates a valid ObjectId string
      console.warn("⚠️ Using fallback buyer ID for testing:", buyerId);
    }

    // Group items by vendor
    const vendorGroups: Record<
      string,
      { product: string; vendor: string; quantity: number; price: number }[]
    > = {};

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.vendor) continue;

      const vendorId = product.vendor.toString();

      if (!vendorGroups[vendorId]) vendorGroups[vendorId] = [];

      vendorGroups[vendorId].push({
        product: product._id.toString(),
        vendor: vendorId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    if (Object.keys(vendorGroups).length === 0) {
      return NextResponse.json(
        { error: "No valid products found in cart" },
        { status: 400 }
      );
    }

    const createdOrders = [];

    // Create orders per vendor
    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      if (items.length === 0) continue; // skip empty groups

      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const order = new Order({
        buyer: buyerId,
        items,
        total,
        status: "Pending",
      });

      const savedOrder = await order.save();
      createdOrders.push(savedOrder);
      console.log(`🟢 Order saved for vendor ${vendorId}`);
    }

    console.log("✅ Checkout complete");
    return NextResponse.json({ message: "Orders created", createdOrders });
  } catch (error: any) {
    console.error("🔥 Checkout route error:", error.message, error.stack);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}





