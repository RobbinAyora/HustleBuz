// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import MarketplaceProduct, { IReview, IProduct } from "@/app/models/Product";
import Shop from "@/app/models/Shop";
import { verifyToken } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";

// Helper: extract token from cookies
async function getToken(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.split("token=")[1]?.split(";")[0] || null;
}

// GET: fetch product by ID with vendor info
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  // Fetch product
  const product = (await MarketplaceProduct.findById(id).lean()) as IProduct | null;
  if (!product)
    return NextResponse.json({ message: "Product not found" }, { status: 404 });

  // Fetch vendor's shop info
  let vendorInfo: { _id: string; name: string; logo?: string; link: string } | null = null;
  if (product.vendor) {
    const shop = await Shop.findOne({ owner: product.vendor }).lean();
    if (shop) {
      vendorInfo = {
        _id: shop._id.toString(),
        name: shop.name,
        logo: shop.logo,
        link: shop.link,
      };
    }
  }

  // Calculate average rating
  const reviews: IReview[] = product.reviews || [];
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: IReview) => sum + r.rating, 0) / reviews.length
      : null;

  return NextResponse.json({ ...product, rating, vendor: vendorInfo });
}

// POST: submit review
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const token = await getToken(req);
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token) as { id: string; name?: string } | null;
  if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body: { rating: number; comment: string } = await req.json();
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ message: "Rating must be 1-5" }, { status: 400 });

  const product = await MarketplaceProduct.findById(id);
  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });

  // ✅ Convert userId string to ObjectId
  const newReview: IReview = {
    user: decoded.name || "Anonymous",
    userId: new mongoose.Types.ObjectId(decoded.id),
    rating,
    comment,
    createdAt: new Date(),
  };

  product.reviews = product.reviews || [];
  product.reviews.push(newReview);
  await product.save();

  return NextResponse.json(newReview, { status: 201 });
}

// PUT: vendor updates product
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const token = await getToken(req);
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token) as { id: string; role?: string } | null;
  if (!decoded || decoded.role !== "vendor")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body: Partial<IProduct> & { categories?: string[] } = await req.json();
  const { name, description, price, stock, images, categories } = body;

  // Ensure vendor owns a shop
  const shop = await Shop.findOne({ owner: decoded.id });
  if (!shop) return NextResponse.json({ message: "Vendor shop not found" }, { status: 404 });

  const updatedProduct = await MarketplaceProduct.findOneAndUpdate(
    { _id: id, vendor: decoded.id },
    {
      name,
      description: description || "",
      price,
      stock,
      images: images || [],
      categories: categories || [],
    },
    { new: true }
  );

  if (!updatedProduct)
    return NextResponse.json({ message: "Product not found or not owned by you" }, { status: 404 });

  return NextResponse.json(updatedProduct);
}

// DELETE: vendor deletes product
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const token = await getToken(req);
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token) as { id: string; role?: string } | null;
  if (!decoded || decoded.role !== "vendor")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Ensure vendor owns a shop
  const shop = await Shop.findOne({ owner: decoded.id });
  if (!shop) return NextResponse.json({ message: "Vendor shop not found" }, { status: 404 });

  const deletedProduct = await MarketplaceProduct.findOneAndDelete({
    _id: id,
    vendor: decoded.id,
  });

  if (!deletedProduct)
    return NextResponse.json({ message: "Product not found or not owned by you" }, { status: 404 });

  return NextResponse.json({ message: "✅ Product deleted successfully" });
}










