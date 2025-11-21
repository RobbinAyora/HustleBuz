import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import SubscriptionPayment from "@/app/models/SubscriptionPayment";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ active: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = verifyToken(token);

    const activeSub = await SubscriptionPayment.findOne({
      userId: decoded.id,
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
  } catch (error: any) {
    console.error("❌ Subscription Status Error:", error.message);
    return NextResponse.json({ active: false, message: "Server error" }, { status: 500 });
  }
}
