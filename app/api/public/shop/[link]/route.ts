import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";

// GET shop by link
export async function GET(
  req: Request,
  context: { params: { link: string } } // ✅ params is an object, not a Promise
) {
  try {
    const { link } = context.params; // no need to await

    await connectDB();

    if (!link) {
      return NextResponse.json({ message: "Missing shop link" }, { status: 400 });
    }

    const shop = await Shop.findOne({ link });
    if (!shop) {
      return NextResponse.json({ message: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json({ shop }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching shop:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Server error", error: message }, { status: 500 });
  }
}

