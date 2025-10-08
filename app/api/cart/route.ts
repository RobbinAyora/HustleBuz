import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Cart from "@/app/models/Cart";
import { verifyToken } from "@/app/lib/auth";

async function getToken(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.split("token=")[1]?.split(";")[0] || null;
}

// ✅ GET: fetch user's cart
export async function GET(req: Request) {
  await connectDB();
  const token = await getToken(req);
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded: any = verifyToken(token);
  if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

  let cart = await Cart.findOne({ userId: decoded.id });
  if (!cart) {
    cart = await Cart.create({ userId: decoded.id, items: [], totalPrice: 0 });
  }

  return NextResponse.json(cart);
}

// ✅ POST: add item to user's cart
export async function POST(req: Request) {
  try {
    await connectDB();
    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId, name, price, image, vendorId } = await req.json();

    if (!productId || !name || !price || !vendorId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    let cart = await Cart.findOne({ userId: decoded.id });

    if (!cart) {
      cart = await Cart.create({
        userId: decoded.id,
        items: [{ productId, vendorId, name, price, image, quantity: 1 }],
        totalPrice: price,
      });
    } else {
      const existingItem = cart.items.find(
        (item: any) => item.productId === productId && item.vendorId === vendorId
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({ productId, vendorId, name, price, image, quantity: 1 });
      }

      cart.totalPrice = cart.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      await cart.save();
    }

    return NextResponse.json({ success: true, cart });
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ message: "Failed to update cart" }, { status: 500 });
  }
}

