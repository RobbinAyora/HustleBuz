import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import Order from "@/app/models/Order";
import { verifyToken } from "@/app/lib/auth";
import mongoose from "mongoose";
import MarketplaceProduct from "@/app/models/Product"; // your Product file exports MarketplaceProduct

export async function GET() {
  try {
    await connectDB();

    // ✅ Ensure both Product model names are registered (fix for MissingSchemaError)
    if (!mongoose.models.Product) {
      mongoose.model("Product", MarketplaceProduct.schema);
    }

    // ✅ Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id: string; role: string };
    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // ✅ Find vendor
    const vendor = await User.findById(decoded.id).select("-password");
    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    // ✅ Vendor’s products
    const products = await MarketplaceProduct.find({ vendor: vendor._id });

    // ✅ Vendor’s orders (populate buyer + products)
    const orders = await Order.find({
      "items.vendor": vendor._id,
    })
      .populate("buyerId", "name email")
      .populate("items.productId", "name price images")
      .sort({ createdAt: -1 });

    // ✅ Calculate total sales
    const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);

    // ✅ Construct clean response
    const response = {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      subscription: { plan: "Free Trial" },
      products,
      orders,
      totalSales,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("❌ Vendor /me route error:", error);
    return NextResponse.json(
      { message: "Server error", details: error.message },
      { status: 500 }
    );
  }
}








