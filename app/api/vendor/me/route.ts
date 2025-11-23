import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import Order from "@/app/models/Order";
import MarketplaceProduct from "@/app/models/Product";
import { verifyToken } from "@/app/lib/auth";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    // ✅ Fix MissingSchemaError on Vercel by always checking model existence
    if (!mongoose.models.MarketplaceProduct) {
      mongoose.model("MarketplaceProduct", MarketplaceProduct.schema);
    }

    if (!mongoose.models.Order) {
      mongoose.model("Order", Order.schema);
    }

    if (!mongoose.models.User) {
      mongoose.model("User", User.schema);
    }

    // ✅ Read token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // ⛔ FIX: Always provide a fallback type to avoid TS errors on Vercel
    let decoded: { id: string; role: string } | null = null;

    try {
      decoded = verifyToken(token) as { id: string; role: string };
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    // ✅ Find vendor
    const vendor = await User.findById(decoded.id).select("-password");

    if (!vendor) {
      return NextResponse.json({ success: false, message: "Vendor not found" }, { status: 404 });
    }

    // ✅ Vendor products
    const products = await MarketplaceProduct.find({ vendor: vendor._id });

    // ✅ Vendor orders
    const orders = await Order.find({
      "items.vendor": vendor._id,
    })
      .populate("buyerId", "name email")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });

    // ✅ Total sales
    const totalSales: number = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        role: vendor.role,
        subscription: { plan: vendor.subscription?.plan ?? "Free Trial" },
        products,
        orders,
        totalSales,
      },
    });
  } catch (error: any) {
    console.error("❌ Vendor /me route error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", details: error.message },
      { status: 500 }
    );
  }
}









