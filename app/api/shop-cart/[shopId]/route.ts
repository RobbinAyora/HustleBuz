import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import ShopCart from "@/app/models/ShopCart";
import { verifyToken } from "@/app/lib/auth";
import MarketplaceProduct from "@/app/models/Product";
import mongoose from "mongoose";

// ✅ Type for cart item
interface CartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  image: string;
  quantity: number;
  vendorId: mongoose.Types.ObjectId;
}

// ✅ Helper: extract token from cookies
async function getToken(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const tokenCookie = cookieHeader.split("; ").find((c) => c.startsWith("token="));
  return tokenCookie ? tokenCookie.split("=")[1] : null;
}

// GET: fetch user's cart for a shop
export async function GET(
  req: Request,
  context: { params:  { shopId: string } }
) {
  const { shopId } = await context.params;
  await connectDB();

  const token = await getToken(req);
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const decoded: any = verifyToken(token);
  if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

  let cart = await ShopCart.findOne({ userId: decoded.id, shopId })
    .populate({
      path: "items.productId",
      model: "MarketplaceProduct",
      select: "name price images vendor",
    })
    .lean();

  if (!cart) {
    cart = await ShopCart.create({
      userId: decoded.id,
      shopId,
      items: [],
      totalPrice: 0,
    });
  }

  return NextResponse.json(cart);
}

// POST: add item to cart
export async function POST(
  req: Request,
  context: { params: { shopId: string } }
) {
  const { shopId } = context.params;

  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId } = await req.json();

    const product = await MarketplaceProduct.findById(productId).select(
      "name price images vendor"
    );
    if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });

    const { name, price, images, vendor } = product;
    const vendorObjId = new mongoose.Types.ObjectId(vendor);

    let cart = await ShopCart.findOne({ userId: decoded.id, shopId });

    if (!cart) {
      cart = await ShopCart.create({
        userId: decoded.id,
        shopId,
        items: [
          {
            productId: new mongoose.Types.ObjectId(productId),
            name,
            price,
            image: images?.[0] || "",
            quantity: 1,
            vendorId: vendorObjId,
          } as CartItem,
        ],
        totalPrice: price,
      });
    } else {
      const existingItem = cart.items.find(
        (item: any) => item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          productId: new mongoose.Types.ObjectId(productId),
          name,
          price,
          image: images?.[0] || "",
          quantity: 1,
          vendorId: vendorObjId,
        } as CartItem);
      }

      cart.totalPrice = cart.items.reduce(
        (sum: number, item: CartItem) => sum + item.price * item.quantity,
        0
      );

      await cart.save();
    }

    const updatedCart = await ShopCart.findOne({ userId: decoded.id, shopId })
      .populate({
        path: "items.productId",
        model: "MarketplaceProduct",
        select: "name price images vendor",
      })
      .lean();

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error: unknown) {
    console.error("POST /api/shop-cart error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Failed to update cart", error: message }, { status: 500 });
  }
}

// DELETE: remove item or clear cart
export async function DELETE(
  req: Request,
  context: { params: { shopId: string } }
) {
  const { shopId } = await context.params;

  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId, clearAll } = await req.json();

    const cart = await ShopCart.findOne({ userId: decoded.id, shopId });
    if (!cart) return NextResponse.json({ message: "Cart not found" }, { status: 404 });

    if (clearAll) {
      await ShopCart.deleteOne({ userId: decoded.id, shopId });
      return NextResponse.json({ message: "Cart cleared" });
    }

    // ✅ Remove the item safely regardless of population
    cart.items = cart.items.filter((item: any) => {
      const id =
        typeof item.productId === "string"
          ? item.productId
          : item.productId._id?.toString();
      return id !== productId;
    });

    // Ensure all items have vendorId before saving
    cart.items = cart.items.map((item: any) => ({
      ...item,
      vendorId: item.vendorId || new mongoose.Types.ObjectId(),
    }));

    // Recalculate total price
    cart.totalPrice = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    // Populate again to return the updated cart
    const updatedCart = await ShopCart.findOne({ userId: decoded.id, shopId })
      .populate({
        path: "items.productId",
        model: "MarketplaceProduct",
        select: "name price images vendor",
      })
      .lean();

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error: unknown) {
    console.error("DELETE /api/shop-cart error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Failed to modify cart", error: message }, { status: 500 });
  }
}
















