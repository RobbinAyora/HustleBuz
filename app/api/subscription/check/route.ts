import { verifyToken } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.split("token=")[1];
  if (!token) return NextResponse.json({ active: false });

  try {
    const decoded: any = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) return NextResponse.json({ active: false });

    const active = user.subscriptionExpires > new Date();
    return NextResponse.json({ active, expires: user.subscriptionExpires });
  } catch {
    return NextResponse.json({ active: false });
  }
}
