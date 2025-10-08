import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Cart from "@/app/models/Cart";
import { verifyToken } from "@/app/lib/auth";

async function getToken(req: Request) {
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
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId } = await params;
    const cart = await Cart.findOne({ userId: decoded.id });

    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    // ✅ Correct comparison
    const itemIndex = cart.items.findIndex(
      (item: any) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ message: "Item not found in cart" }, { status: 404 });
    }

    const removedItem = cart.items[itemIndex];
    cart.items.splice(itemIndex, 1);

    // ✅ Recalculate total
    cart.totalPrice = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    await cart.save(); // ✅ persist changes

    return NextResponse.json({ message: "Item deleted successfully", cart });
  } catch (error: any) {
    console.error("DELETE /api/cart/[productId] error:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}














