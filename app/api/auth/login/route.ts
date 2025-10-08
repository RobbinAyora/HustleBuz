import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { signToken } from "@/app/lib/auth";

export async function POST(req: Request) {
  await connectDB();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user)
    return NextResponse.json({ message: "User not found" }, { status: 404 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

  // ✅ Sign the JWT token
  const token = signToken({ id: user._id, role: user.role });

  // ✅ Prepare response and set cookie
  const res = NextResponse.json({ message: "Login success", role: user.role });

  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ✅ Only secure in production
    sameSite: "lax", // ✅ So cookie works with client-side navigation
    path: "/", // ✅ Accessible across the whole app
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return res;
}

