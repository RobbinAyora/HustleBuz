import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import SubscriptionPayment from "@/app/models/SubscriptionPayment";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import mongoose from "mongoose";

interface DecodedToken {
  id: string;
  role?: string;
  name?: string;
}

export async function GET() {
  try {
    await connectDB();

    // cookies() should not be awaited
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { active: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Try verifying token with safe type narrowing
    let decoded: unknown;
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json(
        { active: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Ensure decoded token matches our expected type
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !("id" in decoded) ||
      typeof (decoded as any).id !== "string"
    ) {
      return NextResponse.json(
        { active: false, message: "Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = new mongoose.Types.ObjectId((decoded as DecodedToken).id);

    const activeSub = await SubscriptionPayment.findOne({
      userId,
      status: "PAID",
      endDate: { $gte: new Date() },
    });

    if (!activeSub) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      expires: activeSub.endDate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("❌ Subscription Status Error:", message);

    return NextResponse.json(
      { active: false, message: "Server error" },
      { status: 500 }
    );
  }
}

