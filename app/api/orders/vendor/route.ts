import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import User from "@/app/models/User";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import MarketplaceProduct from "@/app/models/Product";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id: string; role: string };

    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // ✅ Ensure Product model is registered (for populate)
    if (!mongoose.models.Product) {
      mongoose.model("Product", MarketplaceProduct.schema);
    }

    // ✅ Verify vendor exists
    const vendor = await User.findById(decoded.id).select("-password");
    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    // ✅ Fetch all orders that include this vendor’s items
    const orders = await Order.find({ "items.vendor": vendor._id })
      .populate("buyerId", "name email") // buyerId optional, populate if exists
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });

    // ✅ Compute summary stats
    const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = orders.length;

    // ✅ Include buyer phone for clarity
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      amount: order.amount,
      status: order.status,
      buyerPhone: order.buyerPhone,
      buyer: order.buyerId
        ? { name: order.buyerId.name, email: order.buyerId.email }
        : null,
      items: order.items,
      createdAt: order.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
        },
        stats: {
          totalOrders,
          totalSales,
        },
        orders: formattedOrders,
      },
    });
  } catch (error: any) {
    console.error("❌ Vendor Orders Route Error:", error);
    return NextResponse.json(
      { message: "Server error", details: error.message },
      { status: 500 }
    );
  }
}






