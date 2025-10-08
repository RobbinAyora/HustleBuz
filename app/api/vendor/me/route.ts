import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies(); // ✅ get cookies instance
    const token = cookieStore.get("token")?.value; // ✅ now TypeScript is happy

    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string; role: string };

    if (decoded.role !== "vendor") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const vendor = await User.findById(decoded.id).select("-password");

    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
} 







