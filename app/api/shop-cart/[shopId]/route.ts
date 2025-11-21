import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import ShopCart from "@/app/models/ShopCart";
import { verifyToken } from "@/app/lib/auth";
import MarketplaceProduct from "@/app/models/Product"; 

async function getToken(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.split("token=")[1]?.split(";")[0] || null;
}

/**
 * ✅ GET: Fetch user's cart for a specific shop (with populated vendor info)
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ shopId: string }> }
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
      model: "MarketplaceProduct", // ✅ must match your product model name
      select: "name price images vendor", // only return these fields
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

/**
 * ✅ POST: Add item to the user's cart
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await context.params;

  try {
    await connectDB();

    const token = await getToken(req);
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { productId } = await req.json();

    // ✅ Fetch product details including vendor
    const product = await MarketplaceProduct.findById(productId).select(
      "name price images vendor"
    );
    if (!product)
      return NextResponse.json({ message: "Product not found" }, { status: 404 });

    const { name, price, images, vendor } = product;

    let cart = await ShopCart.findOne({ userId: decoded.id, shopId });

    if (!cart) {
      cart = await ShopCart.create({
        userId: decoded.id,
        shopId,
        items: [
          {
            productId,
            name,
            price,
            image: images?.[0] || "",
            quantity: 1,
            vendorId: vendor, // ✅ added automatically
          },
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
          productId,
          name,
          price,
          image: images?.[0] || "",
          quantity: 1,
          vendorId: vendor, // ✅ added automatically
        });
      }

      cart.totalPrice = cart.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      await cart.save();
    }

    const updatedCart = await ShopCart.findOne({
      userId: decoded.id,
      shopId,
    })
      .populate({
        path: "items.productId",
        model: "MarketplaceProduct",
        select: "name price images vendor",
      })
      .lean();

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error("POST /api/shop-cart error:", error);
    return NextResponse.json({ message: "Failed to update cart" }, { status: 500 });
  }
}
/**
 * ✅ DELETE: Remove item or clear cart
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ shopId: string }> }
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

    cart.items = cart.items.filter(
      (item: any) => item.productId.toString() !== productId
    );

    cart.totalPrice = cart.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    await cart.save();

    const updatedCart = await ShopCart.findOne({
      userId: decoded.id,
      shopId,
    })
      .populate({
        path: "items.productId",
        model: "MarketplaceProduct",
        select: "name price images vendor",
      })
      .lean();

    return NextResponse.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error("DELETE /api/shop-cart error:", error);
    return NextResponse.json({ message: "Failed to modify cart" }, { status: 500 });
  }
}














