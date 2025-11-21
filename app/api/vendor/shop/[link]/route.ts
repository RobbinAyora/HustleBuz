import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";

export async function GET(
  request: Request,
  { params }: { params: { link: string } }
) {
  await connectDB();

  const { link } = params;
  if (!link) {
    return NextResponse.json({ message: "Missing shop link" }, { status: 400 });
  }

  try {
    // Find the shop by its public link
    const shop = await Shop.findOne({ link }).lean();

    if (!shop) {
      return NextResponse.json({ message: "Shop not found" }, { status: 404 });
    }

    // Return only the fields safe for public view
    return NextResponse.json({
      shop: {
        _id: shop._id,
        name: shop.name,
        logo: shop.logo,
        link: shop.link,
        theme: shop.theme || {
          primaryColor: "#1D4ED8",
          secondaryColor: "#FFFFFF",
          accentColor: "#FBBF24",
          layout: "classic",
        },
        description: shop.description || "",
      },
    });
  } catch (err: any) {
    console.error("Public shop fetch error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}


