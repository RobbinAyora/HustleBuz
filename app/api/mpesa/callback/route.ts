import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import CheckoutSession from "@/app/models/CheckoutSession";
import Order from "@/app/models/Order";

/**
 * M-PESA CALLBACK HANDLER
 * Receives STK push result from Safaricom via the MPESA_CALLBACK_URL
 * - Logs all callback data
 * - Updates CheckoutSession
 * - Creates Order when payment is successful
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    console.log("📩 Received M-Pesa Callback:");
    console.log(JSON.stringify(body, null, 2));

    // ✅ Validate structure
    const { Body } = body;
    if (!Body || !Body.stkCallback) {
      console.warn("⚠️ Invalid callback format — missing Body or stkCallback");
      return NextResponse.json({ success: false, message: "Invalid callback" });
    }

    const stkCallback = Body.stkCallback;
    const resultCode = stkCallback?.ResultCode;
    const checkoutRequestID = stkCallback?.CheckoutRequestID;

    console.log("🔍 Callback resultCode:", resultCode);
    console.log("🆔 CheckoutRequestID:", checkoutRequestID);

    // ✅ Find matching checkout session
    const session = await CheckoutSession.findOne({ checkoutRequestID });

    if (!session) {
      console.warn("⚠️ No matching CheckoutSession found for callback ID:", checkoutRequestID);

      const existing = await CheckoutSession.find({});
      console.log("📦 Existing CheckoutSessions in DB:");
      console.dir(existing, { depth: null });

      return NextResponse.json({ success: false, message: "Session not found" });
    }

    // ✅ Successful Payment
    if (resultCode === 0) {
      console.log("✅ Payment SUCCESS for order:", session.orderId);

      await session.updateOne({ status: "SUCCESS" });

      // ✅ Create Order from checkout session
      const newOrder = await Order.create({
        items: session.cart.items.map((item: any) => ({
          product: item.productId,
          vendor: item.vendor,
          quantity: item.quantity,
          price: item.price,
        })),
        totalPrice: session.amount,
        status: "Paid",
      });

      console.log("🧾 Order created successfully:", newOrder._id);

      // ✅ Debugging: show all orders in DB
      const allOrders = await Order.find({})
        .populate("items.product")
        .populate("items.vendor")
        .lean();

      console.log("📊 All Orders in DB:");
      console.dir(allOrders, { depth: null });

      return NextResponse.json({ success: true, message: "Order created", orderId: newOrder._id });
    } else {
      // ❌ Failed payment
      await session.updateOne({ status: "FAILED" });
      console.log("❌ Payment FAILED for order:", session.orderId);

      return NextResponse.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error("🚨 Callback Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}





