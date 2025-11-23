// app/api/products/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/db";
import MarketplaceProduct from "@/app/models/Product";
import { verifyToken } from "@/app/lib/auth";

/**
 * ✅ Utility: Extract JWT token from cookies
 */
function extractTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("token="));
  return tokenCookie ? tokenCookie.split("=")[1] : null;
}

/**
 * ✅ Allowed product categories
 */
const ALLOWED_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Toys & Games",
  "Automotive",
  "Books",
  "Health",
  "Groceries",
  "Other",
];

/**
 * ✅ GET — Fetch Products
 */
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor");
    const marketplace = searchParams.get("marketplace");

    // Public shop products
    if (vendorId) {
      const products = await MarketplaceProduct.find({ vendor: vendorId }).sort({ createdAt: -1 });
      return NextResponse.json(products, { status: 200 });
    }

    // Marketplace-wide view
    if (marketplace === "true") {
      const products = await MarketplaceProduct.find().sort({ createdAt: -1 });
      return NextResponse.json(products, { status: 200 });
    }

    // Vendor dashboard (requires auth)
    const token = extractTokenFromCookies(req.headers.get("cookie"));
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string; role: string } | null;
    if (!decoded || decoded.role !== "vendor") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const products = await MarketplaceProduct.find({ vendor: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json(products, { status: 200 });

  } catch (error: any) {
    console.error("❌ GET Products Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch products", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * ✅ POST — Create a New Product
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    const token = extractTokenFromCookies(req.headers.get("cookie"));
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string; role: string } | null;
    if (!decoded || decoded.role !== "vendor") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body: {
      name: string;
      description?: string;
      price: number;
      stock: number;
      images?: string[];
      categories?: string[];
    } = await req.json();

    const { name, description, price, stock, images, categories } = body;

    if (!name || typeof price !== "number" || typeof stock !== "number") {
      return NextResponse.json({ message: "Please provide all required fields" }, { status: 400 });
    }

    const validCategories = Array.isArray(categories)
      ? categories.filter((c) => ALLOWED_CATEGORIES.includes(c))
      : ["Other"];

    const newProduct = await MarketplaceProduct.create({
      name,
      description: description?.trim() || "",
      price,
      stock,
      images: Array.isArray(images) ? images : [],
      categories: validCategories.length ? validCategories : ["Other"],
      vendor: new mongoose.Types.ObjectId(decoded.id), // ✅ Convert string to ObjectId
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error: any) {
    console.error("❌ POST Product Error:", error);
    return NextResponse.json(
      { message: "Failed to add product", error: error.message },
      { status: 500 }
    );
  }
}












