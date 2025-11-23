import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Product from "@/app/models/Product";
import Order from "@/app/models/Order";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ Type for incoming cart items
interface CartItem {
  productId: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    console.log("🟦 Checkout request received");

    // ✅ Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB Connected");

    // ✅ Parse request body
    const body = await req.json();
    const cartItems: CartItem[] = body.cartItems;
    console.log("🟨 Request body:", body);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty cart items" },
        { status: 400 }
      );
    }

    // ✅ Extract JWT from cookies or Authorization header
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("token")?.value;
    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const token = cookieToken || headerToken;
    let userId: string | null = null;
    let userRole: string | undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role?: string };
        userId = decoded.id;
        userRole = decoded.role;
        console.log(`🟢 Authenticated user (${userRole || "unknown"}) -> ${userId}`);
      } catch {
        console.warn("⚠️ Invalid JWT token");
      }
    }

    // ⚠️ TEMP fallback (for dev testing only)
    if (!userId) {
      userId = new mongoose.Types.ObjectId().toString();
      console.warn("⚠️ Using fallback user ID for testing:", userId);
    }

    // ✅ Group items by vendor
    const vendorGroups: Record<
      string,
      { product: string; vendor: string; quantity: number; price: number }[]
    > = {};

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.vendor) {
        console.warn(`⚠️ Product not found or missing vendor: ${item.productId}`);
        continue;
      }

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

    // ✅ Create separate orders per vendor
    for (const [vendorId, items] of Object.entries(vendorGroups)) {
      if (items.length === 0) continue;

      // ✅ Type items for reduce
      const total = items.reduce(
        (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
        0
      );

      const order = new Order({
        buyer: userId,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("🔥 Checkout route error:", message);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}






