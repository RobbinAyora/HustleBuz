import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";

// ✅ Define types for request body
interface PaymentDetails {
  status: string;
  amount?: number;
  [key: string]: any; // allow other optional payment fields
}

interface PaymentUpdateBody {
  orderId: string;
  paymentDetails: PaymentDetails;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body: PaymentUpdateBody = await req.json();
    const { orderId, paymentDetails } = body;

    if (!orderId || !paymentDetails || !paymentDetails.status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // ✅ Update order status
    if (paymentDetails.status === "Completed") {
      order.status = "Processing";
    }

    // ✅ Update total if provided
    if (typeof paymentDetails.amount === "number") {
      order.total = paymentDetails.amount;
    }

    // ✅ Safely store payment details in order (extend schema if needed)
    order.set("paymentDetails", paymentDetails);

    await order.save();

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error("🔥 POST /api/orders/payment-update error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}

