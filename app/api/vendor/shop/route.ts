// app/api/vendor/shop/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";
import mongoose from "mongoose";
import { verify } from "jsonwebtoken";
import { JWT_SECRET } from "@/app/lib/auth"; // Make sure JWT_SECRET is exported from here

interface JwtPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Helper: verify token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload | string;
    if (typeof decoded === "string") return null;
    return decoded;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
};

// Helper: get vendor ID from JWT in cookies
const getVendorIdFromRequest = (req: Request) => {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(cookie => {
      const [name, ...rest] = cookie.trim().split("=");
      return [name, rest.join("=")];
    })
  );

  const token = cookies["token"];
  if (!token) return null;

  const decoded = verifyToken(token);
  return decoded?.id || null;
};

// ------------------- GET Route -------------------
export async function GET(req: Request) {
  await connectDB();

  try {
    const vendorIdStr = getVendorIdFromRequest(req);
    if (!vendorIdStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(vendorIdStr)) {
      return NextResponse.json({ message: "Invalid vendor ID" }, { status: 400 });
    }
    const vendorId = new mongoose.Types.ObjectId(vendorIdStr);

    const shop = await Shop.findOne({ owner: vendorId }).lean();
    if (!shop)
      return NextResponse.json(
        { message: "Shop not found for this vendor" },
        { status: 404 }
      );

    return NextResponse.json(shop);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ------------------- PUT Route -------------------
export async function PUT(req: Request) {
  await connectDB();

  try {
    const vendorIdStr = getVendorIdFromRequest(req);
    if (!vendorIdStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(vendorIdStr)) {
      return NextResponse.json({ message: "Invalid vendor ID" }, { status: 400 });
    }
    const vendorId = new mongoose.Types.ObjectId(vendorIdStr);

    const body = await req.json();
    const { name, contact, logo, themeColor, link } = body;

    if (!name || !contact || !link) {
      return NextResponse.json(
        { message: "Name, contact, and link are required." },
        { status: 400 }
      );
    }

    // Find existing shop for this vendor
    let shop = await Shop.findOne({ owner: vendorId });

    if (shop) {
      shop.name = name;
      shop.contact = contact;
      shop.logo = logo;
      shop.themeColor = themeColor || "#1D4ED8";
      shop.link = link;
      await shop.save();
    } else {
      shop = await Shop.create({
        name,
        contact,
        logo,
        themeColor: themeColor || "#1D4ED8",
        link,
        owner: vendorId,
      });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to save shop" },
      { status: 500 }
    );
  }
}





