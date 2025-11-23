import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import SubscriptionPayment from "@/app/models/SubscriptionPayment";
import User from "@/app/models/User";
import jwt from "jsonwebtoken";
import { confirmStkPayment } from "@/actions/StkPushQuery";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

interface JwtPayload {
  id: string;
  role?: string;
  name?: string;
}

// Helper: Check active paid subscription or pending STK payments
async function checkPaidSubscription(userId: string) {
  console.log("💰 Checking for active paid subscription...");

  let paidSub = await SubscriptionPayment.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: "PAID",
    endDate: { $gte: new Date() },
  });

  console.log("💰 Paid subscription found:", !!paidSub);

  if (!paidSub) {
    const pendingSub = await SubscriptionPayment.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "PENDING",
      checkoutRequestID: { $exists: true, $ne: null },
    });

    console.log("⏳ Pending subscription found:", !!pendingSub);

    if (pendingSub) {
      console.log("⏳ Checking STK payment status for subscription:", pendingSub._id);
      const result = await confirmStkPayment(pendingSub._id.toString(), pendingSub.checkoutRequestID);
      console.log("🔍 STK query result:", result);

      if (result.status === "PAID") {
        paidSub = await SubscriptionPayment.findById(pendingSub._id); // reload updated document
        console.log("✅ Subscription marked as PAID after STK confirmation:", paidSub?._id);
      } else if (result.status === "FAILED") {
        console.log("❌ STK payment failed for subscription:", pendingSub._id);
      } else {
        console.log("⏳ Payment still pending for subscription:", pendingSub._id);
      }
    }
  }

  return paidSub;
}

// Helper: Check for active free trial
async function checkFreeTrial(userId: string) {
  console.log("🆓 Checking for active free trial...");
  const freeTrial = await SubscriptionPayment.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    plan: "free_trial",
    status: "ACTIVE",
    endDate: { $gte: new Date() },
  });

  console.log("🆓 Active free trial found:", !!freeTrial);
  return freeTrial;
}

// Helper: Create new free trial if allowed
async function createFreeTrial(userId: string) {
  console.log("🆕 Creating new free trial...");
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);

  const newTrial = await SubscriptionPayment.create({
    userId: new mongoose.Types.ObjectId(userId),
    plan: "free_trial",
    status: "ACTIVE",
    startDate: start,
    endDate: end,
  });

  console.log("✅ New free trial created, expires:", newTrial.endDate);
  return newTrial;
}

export async function GET(req: Request) {
  console.log("🔍 Incoming Subscription Check Request");

  try {
    await connectDB();
    console.log("✅ Database connected");

    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) {
      console.log("❌ No cookie found");
      return NextResponse.json({ success: false, message: "No cookie found" }, { status: 401 });
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    if (!token) {
      console.log("❌ No token found in cookies");
      return NextResponse.json({ success: false, message: "No token found" }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      console.log("✅ Token decoded:", decoded);
    } catch (err) {
      console.log("❌ Invalid token:", err);
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // 1️⃣ Check paid subscription or pending STK payments
    const paidSub = await checkPaidSubscription(userId);
    if (paidSub) {
      return NextResponse.json({
        success: true,
        paid: true,
        trialActive: false,
        plan: paidSub.plan,
        status: "PAID",
        expiresAt: paidSub.endDate,
      });
    }

    // 2️⃣ Check active free trial
    const freeTrial = await checkFreeTrial(userId);
    if (freeTrial) {
      return NextResponse.json({
        success: true,
        paid: false,
        trialActive: true,
        plan: "FREE_TRIAL",
        status: "ACTIVE",
        expiresAt: freeTrial.endDate,
      });
    }

    // 3️⃣ Create free trial if allowed
    const existingSubs = await SubscriptionPayment.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!existingSubs && user.role !== "vendor") {
      const newTrial = await createFreeTrial(userId);
      return NextResponse.json({
        success: true,
        paid: false,
        trialActive: true,
        plan: "FREE_TRIAL",
        status: "ACTIVE",
        expiresAt: newTrial.endDate,
      });
    }

    // 4️⃣ Subscription exists but expired
    return NextResponse.json({
      success: false,
      paid: false,
      trialActive: false,
      plan: "NONE",
      status: "EXPIRED",
      message: "Subscription or trial expired",
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Subscription Check Error:", message);
    return NextResponse.json(
      { success: false, message: "Server error", details: message },
      { status: 500 }
    );
  }
}











