import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Cart from "@/app/models/Cart";
import { verifyToken } from "@/app/lib/auth";
import mongoose from "mongoose";

// ✅ Define CartItem interface
interface CartItem {
  productId: mongoose.Types.ObjectId | string;
  vendorId: mongoose.Types.ObjectId | string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

// ✅ Helper to get token from request
async function getToken(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.split("token=")[1]?.split(";")[0] || null;
}

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as { id: string } | null;
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { productId } = params;

    const cart = await Cart.findOne({ userId: decoded.id });
    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    // ✅ Find the item index in the cart
    const itemIndex = cart.items.findIndex(
      (item: CartItem) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ message: "Item not found in cart" }, { status: 404 });
    }

    // ✅ Remove the item
    cart.items.splice(itemIndex, 1);

    // ✅ Recalculate total price
    cart.totalPrice = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    // ✅ Save updated cart
    await cart.save();

    return NextResponse.json({ message: "Item deleted successfully", cart });
  } catch (error: unknown) {
    console.error("DELETE /api/cart/[productId] error:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
















