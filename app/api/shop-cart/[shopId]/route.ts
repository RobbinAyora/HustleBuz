import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import ShopCart from "@/app/models/ShopCart";

// ✅ Add to cart
export async function POST(req: Request, { params }: { params: { shopId: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, productId, name, price, image, quantity } = body;

    let cart = await ShopCart.findOne({ userId, shopId: params.shopId });

    if (!cart) {
      cart = new ShopCart({
        userId,
        shopId: params.shopId,
        items: [{ productId, name, price, image, quantity }],
        totalPrice: price * quantity,
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, name, price, image, quantity });
      }

      cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
    }

    await cart.save();
    return NextResponse.json(cart);
  } catch (error: any) {
    console.error("POST cart error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ Get cart for a shop + user
export async function GET(req: Request, { params }: { params: { shopId: string } }) {
  try {
    await connectDB();

    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const cart = await ShopCart.findOne({ userId, shopId: params.shopId }).lean();
    return NextResponse.json(cart || { items: [], totalPrice: 0 });
  } catch (error: any) {
    console.error("GET cart error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ Delete item or clear cart
export async function DELETE(req: Request, { params }: { params: { shopId: string } }) {
  try {
    await connectDB();

    const { userId, productId } = await req.json();

    const cart = await ShopCart.findOne({ userId, shopId: params.shopId });
    if (!cart) return NextResponse.json({ message: "Cart not found" });

    if (productId) {
      // Remove a single product
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
    } else {
      // Clear the entire cart
      cart.items = [];
    }

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();
    return NextResponse.json(cart);
  } catch (error: any) {
    console.error("DELETE cart error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
