import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";
import mongoose from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@/app/lib/auth";

/**
 * Helper: Extract token safely
 */
function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  return cookies["token"] || null;
}

/**
 * Helper: Ensure model is registered ONCE (Fix for Vercel)
 */
function ensureMongooseModel(name: string, schema: mongoose.Schema) {
  if (!mongoose.models[name]) {
    mongoose.model(name, schema);
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    // Fix Vercel multi-load issue
    ensureMongooseModel("Shop", Shop.schema);

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let decoded: JwtPayload & { id?: string } = {};
    try {
      decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload & { id?: string };
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    if (!decoded.id) {
      return NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 401 });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(decoded.id);

    // Fetch shop
    let shop = await Shop.findOne({ owner: vendorObjectId });

    // Auto-create shop if missing
    if (!shop) {
      shop = await Shop.create({
        name: "My Shop",
        contact: "0700000000",
        link: `shop-${decoded.id.slice(-5)}`,
        owner: vendorObjectId,
        theme: {
          primaryColor: "#1D4ED8",
          secondaryColor: "#FFFFFF",
          accentColor: "#FBBF24",
          layout: "classic",
        },
      });
    }

    return NextResponse.json({ success: true, shop }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/vendor/shop error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    // Fix Vercel multi-load issue
    ensureMongooseModel("Shop", Shop.schema);

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let decoded: JwtPayload & { id?: string } = {};
    try {
      decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload & { id?: string };
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    if (!decoded.id) {
      return NextResponse.json({ success: false, message: "Invalid token payload" }, { status: 401 });
    }

    const vendorObjectId = new mongoose.Types.ObjectId(decoded.id);

    // Safely read JSON body (Vercel requires casting)
    const body = (await req.json()) as {
      name?: string;
      contact?: string;
      logo?: string;
      link?: string;
      theme?: Record<string, any>;
    };

    const { name, contact, logo, link, theme } = body;

    if (!name || !contact || !link) {
      return NextResponse.json(
        { success: false, message: "Name, contact, and link are required." },
        { status: 400 }
      );
    }

    // Prevent duplicate links
    const existingLink = await Shop.findOne({
      link,
      owner: { $ne: vendorObjectId },
    });

    if (existingLink) {
      return NextResponse.json(
        { success: false, message: "Shop link already taken." },
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

    return NextResponse.json({ success: true, shop: updatedShop }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/vendor/shop error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save shop", error: err.message },
      { status: 500 }
    );
  }
}



