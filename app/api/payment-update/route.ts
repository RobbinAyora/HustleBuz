// /api/orders/payment-update/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, paymentDetails } = body;

    if (!orderId || !paymentDetails || !paymentDetails.status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

    order.status = paymentDetails.status === "Completed" ? "Processing" : order.status;
    order.total = paymentDetails.amount || order.total;

    // Optionally, you can add payment info to order
    (order as any).paymentDetails = paymentDetails;

    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("🔥 POST /api/orders/payment-update error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
