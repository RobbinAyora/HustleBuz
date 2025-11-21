import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import SubscriptionPayment from "@/app/models/SubscriptionPayment";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import { sendStkPush } from "@/actions/StkPush";
 // your helper

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    const { mpesa_number, plan } = await req.json();

    if (!mpesa_number || !plan) {
      return NextResponse.json(
        { success: false, message: "Missing phone number or plan" },
        { status: 400 }
      );
    }

    // ✅ Choose amount based on plan
    const amount = plan === "weekly" ? 1 : 2;// adjust as you wish

    // ✅ Create subscription payment record
    const sub = await SubscriptionPayment.create({
      userId: decoded.id,
      amount,
      status: "PENDING",
    });

    // ✅ Send M-Pesa STK push for subscription
    const stkResponse = await sendStkPush({
      _id: sub._id.toString(),
      mpesa_number,
      amount,
      purpose: "subscription",
    });

    // Save CheckoutRequestID
    if (stkResponse.success) {
      await SubscriptionPayment.findByIdAndUpdate(sub._id, {
        checkoutRequestID: stkResponse.data.CheckoutRequestID,
      });
    }

    return NextResponse.json({
      success: true,
      data: stkResponse.data,
      subscriptionId: sub._id,
    });
  } catch (error: any) {
    console.error("❌ Subscription Create Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
