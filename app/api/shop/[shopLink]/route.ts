import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Extract shopLink from URL
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/"); // ["", "api", "shop", "shopLink"]
    const shopLink = pathnameParts[pathnameParts.length - 1]; // last part is the shop link

    const shop = await Shop.findOne({ link: shopLink }).lean();
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json({ shop });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}



