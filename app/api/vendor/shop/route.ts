import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";
import mongoose from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@/app/lib/auth";

/**
 * Helper: Extract token from cookies
 */
function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [name, ...rest] = c.trim().split("=");
      return [name, rest.join("=")];
    })
  );

  return cookies["token"] || null;
}

/**
 * GET: Fetch shop for the authenticated vendor
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ JWT_SECRET is guaranteed to be a string
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const vendorId = decoded?.id;

    if (!vendorId) {
      return NextResponse.json(
        { message: "Invalid token payload" },
        { status: 401 }
      );
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

    // ✅ Find or create shop for this user
    let shop = await Shop.findOne({ owner: vendorObjectId });

    if (!shop) {
      shop = await Shop.create({
        name: "My Shop",
        contact: "0700000000",
        link: `shop-${vendorId.toString().slice(-5)}`,
        owner: vendorObjectId,
        theme: {
          primaryColor: "#1D4ED8",
          secondaryColor: "#FFFFFF",
          accentColor: "#FBBF24",
          layout: "classic",
        },
      });
      console.log("✅ Default shop created for vendor:", vendorId);
    }

    return NextResponse.json({ shop }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/vendor/shop error:", err.message);
    return NextResponse.json(
      { message: "Internal server error", error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update shop for authenticated vendor
 */
export async function PUT(req: Request) {
  try {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ JWT_SECRET is guaranteed to be a string
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const vendorId = decoded?.id;

    if (!vendorId) {
      return NextResponse.json(
        { message: "Invalid token payload" },
        { status: 401 }
      );
    }

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    const { name, contact, logo, link, theme } = await req.json();

    if (!name || !contact || !link) {
      return NextResponse.json(
        { message: "Name, contact, and link are required." },
        { status: 400 }
      );
    }

    // 🚫 Prevent duplicate shop link
    const existing = await Shop.findOne({
      link,
      owner: { $ne: vendorObjectId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Shop link already taken." },
        { status: 400 }
      );
    }

    const defaultTheme = {
      primaryColor: "#1D4ED8",
      secondaryColor: "#FFFFFF",
      accentColor: "#FBBF24",
      layout: "classic",
    };

    const mergedTheme = { ...defaultTheme, ...(theme || {}) };

    const updatedShop = await Shop.findOneAndUpdate(
      { owner: vendorObjectId },
      { name, contact, logo, link, theme: mergedTheme },
      { new: true, upsert: true }
    );

    return NextResponse.json({ shop: updatedShop }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/vendor/shop error:", err);
    return NextResponse.json(
      { message: "Failed to save shop", error: err.message },
      { status: 500 }
    );
  }
}


