import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";


export async function POST(req: Request) {
  await connectDB();
  const { name, email, password, role } = await req.json();

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ message: "Email already registered" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role,
    subscriptionExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month trial
  });

  return NextResponse.json({ message: "Account created", user }, { status: 201 });
}
