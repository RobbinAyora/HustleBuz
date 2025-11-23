import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/db";
import Cart from "@/app/models/Cart";
import MarketplaceProduct from "@/app/models/Product"; 
import { verifyToken } from "@/app/lib/auth";

// ✅ CartItem interface
interface CartItem {
  productId: mongoose.Types.ObjectId | string;
  vendorId: mongoose.Types.ObjectId | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

// Helper: get token from cookies
async function getToken(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.split("token=")[1]?.split(";")[0] || null;
}

// GET: fetch user's cart
export async function GET(req: Request) {
  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string } | null;
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    let cart = await Cart.findOne({ userId: decoded.id }).populate({
      path: "items.productId",
      model: MarketplaceProduct,
      select: "name price vendor images",
      populate: { path: "vendor", select: "_id name" },
    });

    if (!cart) {
      cart = await Cart.create({ userId: decoded.id, items: [], totalPrice: 0 });
    }

    return NextResponse.json(cart);
  } catch (error: unknown) {
    console.error("GET /api/cart error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch cart";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST: add item to cart
export async function POST(req: Request) {
  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string } | null;
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId, name, price, image, vendorId } = await req.json();

    if (!productId || !name || !price || !vendorId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const cartItem: CartItem = {
      productId: new mongoose.Types.ObjectId(productId),
      vendorId: new mongoose.Types.ObjectId(vendorId),
      name,
      price,
      image,
      quantity: 1,
    };

    let cart = await Cart.findOne({ userId: decoded.id });

    if (!cart) {
      cart = await Cart.create({
        userId: decoded.id,
        items: [cartItem],
        totalPrice: price,
      });
    } else {
      const existingItem = cart.items.find(
        (item: CartItem) =>
          item.productId.toString() === productId &&
          item.vendorId.toString() === vendorId
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push(cartItem);
      }

      cart.totalPrice = cart.items.reduce(
        (sum: number, item: CartItem) => sum + item.price * item.quantity,
        0
      );

      await cart.save();
    }

    return NextResponse.json({ success: true, cart });
  } catch (error: unknown) {
    console.error("POST /api/cart error:", error);
    const message = error instanceof Error ? error.message : "Failed to update cart";
    return NextResponse.json({ message, error: message }, { status: 500 });
  }
}

// DELETE: remove item from cart
export async function DELETE(
  req: Request,
  { params }: { params: { productId: string; vendorId: string } }
) {
  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token) as { id: string } | null;
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId, vendorId } = params;
    let cart = await Cart.findOne({ userId: decoded.id });

    if (!cart) return NextResponse.json({ message: "Cart not found" }, { status: 404 });

    const itemIndex = cart.items.findIndex(
      (item: CartItem) =>
        item.productId.toString() === productId &&
        item.vendorId.toString() === vendorId
    );

    if (itemIndex === -1) return NextResponse.json({ message: "Item not found in cart" }, { status: 404 });

    cart.items.splice(itemIndex, 1);

    cart.totalPrice = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    return NextResponse.json({ success: true, message: "Item removed", cart });
  } catch (error: unknown) {
    console.error("DELETE /api/cart error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete item";
    return NextResponse.json({ message, error: message }, { status: 500 });
  }
}




