import { NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { id?: string };

    if (!decoded?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    // ✅ Narrow unknown type safely
    const message =
      error instanceof Error ? error.message : "Invalid or expired token";
    console.error("Error in /api/auth/me:", message);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}



