import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";

export async function GET(req: Request, context: { params: Promise<{ link: string }> }) {
  try {
    // ✅ Await params before using it
    const { link } = await context.params;

    await connectDB();

    if (!link) {
      return NextResponse.json({ message: "Missing shop link" }, { status: 400 });
    }

    const shop = await Shop.findOne({ link });
    if (!shop) {
      return NextResponse.json({ message: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json({ shop }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
