// app/api/vendor/profile/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/app/lib/db";
import User from "@/app/models/User";

export async function GET() {
  try {
    await connectDB();

    // ✅ await cookies() in server components
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string; role: string };
    if (decoded.role !== "vendor") return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const vendor = await User.findById(decoded.id).select("-password");
    if (!vendor) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("GET /vendor/profile error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string; role: string };
    if (decoded.role !== "vendor") return NextResponse.json({ message: "Access denied" }, { status: 403 });

    const { name, email, phoneNumber, image } = await req.json();

    const updatedVendor = await User.findByIdAndUpdate(
      decoded.id,
      {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(image !== undefined && { image }),
      },
      { new: true }
    ).select("-password");

    if (!updatedVendor) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("PUT /vendor/profile error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}


