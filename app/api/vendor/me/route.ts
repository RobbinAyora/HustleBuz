import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import Order from "@/app/models/Order";
import MarketplaceProduct from "@/app/models/Product";  // correct model
import { verifyToken } from "@/app/lib/auth";

export async function GET() {
  try {
    await connectDB();

    // Read token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: { id: string; role: string } | null = null;

    try {
      decoded = verifyToken(token) as { id: string; role: string };
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded || decoded.role !== "vendor") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Find vendor
    const vendor = await User.findById(decoded.id).select("-password");

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }

    // Vendor products
    const products = await MarketplaceProduct.find({
      vendor: vendor._id,
    });

    // Vendor orders
    const orders = await Order.find({
      "items.vendor": vendor._id,
    })
      .populate("buyerId", "name email")
      .populate({
        path: "items.productId",
        model: "MarketplaceProduct", // IMPORTANT FIX
        select: "name price images",
      })
      .sort({ createdAt: -1 });

    // Total sales
    const totalSales: number = orders.reduce(
      (sum, o) => sum + Number(o.amount || 0),
      0
    );

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










