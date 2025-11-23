import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import SubscriptionPayment from "@/app/models/SubscriptionPayment";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import { sendStkPush } from "@/actions/StkPush";
import mongoose from "mongoose";

/**
 * ✅ Types for STK push
 */
interface StkPushParams {
  _id: string;
  mpesa_number: string;
  amount: number;
  purpose: "subscription" | "order"; // matches sendStkPush
}

// Relaxed STK response type to remove TS errors
interface StkPushResponse {
  success: boolean;
  data?: { CheckoutRequestID: string; [key: string]: any };
  error?: string;
}

export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Extract JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    // Decode JWT token
    const decoded = verifyToken(token) as { id: string; role?: string; name?: string } | null;
    if (!decoded)
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });

    // Parse request body
    const body: { mpesa_number: string; plan: string } = await req.json();
    const { mpesa_number, plan } = body;

    if (!mpesa_number || !plan)
      return NextResponse.json(
        { success: false, message: "Missing phone number or plan" },
        { status: 400 }
      );

    // Determine subscription amount (adjust as needed)
    const amount = plan === "weekly" ? 1 : 2;

    // Create subscription record in DB
    const sub = await SubscriptionPayment.create({
      userId: new mongoose.Types.ObjectId(decoded.id),
      amount,
      status: "PENDING",
    });

    // Prepare STK push parameters
    const stkParams: StkPushParams = {
      _id: sub._id.toString(),
      mpesa_number,
      amount,
      purpose: "subscription",
    };

    // Send M-PESA STK push
    const stkResponse: StkPushResponse = await sendStkPush(stkParams);

    // Handle STK response
    if (stkResponse.success && stkResponse.data?.CheckoutRequestID) {
      await SubscriptionPayment.findByIdAndUpdate(sub._id, {
        checkoutRequestID: stkResponse.data.CheckoutRequestID,
      });

      return NextResponse.json({
        success: true,
        data: stkResponse.data,
        subscriptionId: sub._id,
      });
    } else {
      return NextResponse.json(
        { success: false, error: stkResponse.error || "STK push failed" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Subscription Create Error:", message);

    return NextResponse.json(
      { success: false, message: "Server error", details: message },
      { status: 500 }
    );
  }
}




