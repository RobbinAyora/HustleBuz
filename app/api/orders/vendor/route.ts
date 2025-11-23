import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import User from "@/app/models/User";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import MarketplaceProduct from "@/app/models/Product";

// ✅ Define local type for Order items
interface OrderItem {
  productId: mongoose.Types.ObjectId | string;
  vendor: mongoose.Types.ObjectId | string;
  quantity: number;
  price: number;
}

interface OrderType {
  _id: mongoose.Types.ObjectId | string;
  buyerId?: { name: string; email: string } | null;
  buyerPhone?: string;
  items: OrderItem[];
  amount: number;
  status: string;
  createdAt: Date;
}

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id: string; role: string } | null;
    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    if (!mongoose.models.Product) {
      mongoose.model("Product", MarketplaceProduct.schema);
    }

    const vendor = await User.findById(decoded.id).select("-password");
    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    // Fetch all orders that include this vendor’s items
    const ordersRaw = await Order.find({ "items.vendor": vendor._id })
      .populate("buyerId", "name email")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Map raw orders to OrderType safely
    const orders: OrderType[] = ordersRaw.map((order: any) => ({
      _id: order._id,
      buyerId: order.buyerId
        ? { name: order.buyerId.name, email: order.buyerId.email }
        : null,
      buyerPhone: order.buyerPhone || "",
      items: (order.items || []).map((item: any) => ({
        productId: item.productId._id || item.productId,
        vendor: item.vendor,
        quantity: item.quantity,
        price: item.price,
      })),
      amount: order.amount || 0,
      status: order.status,
      createdAt: order.createdAt,
    }));

    const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = orders.length;

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
  } catch (error: unknown) {
    console.error("❌ Vendor Orders Route Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Server error", details: message }, { status: 500 });
  }
}









