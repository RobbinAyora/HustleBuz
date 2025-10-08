import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Shop from "@/app/models/Shop";
import ShopCart from "@/app/models/ShopCart";
import Product from "@/app/models/Product";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ Extract user ID from JWT stored in cookie
async function getUserIdFromCookie() {
  const cookieStore = await cookies(); // must await
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    return null;
  }
}

// Helper: extract shopLink from request URL
function extractShopLink(req: Request) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // /api/shop/[shopLink]/cart → shopLink is at index 2
  return segments[2];
}

// ➕ POST — Add item to cart
export async function POST(req: Request) {
  try {
    await connectDB();

    const shopLink = extractShopLink(req);
    console.log("🟢 Add to Cart request for shop:", shopLink);

    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, quantity } = await req.json();

    const shop = await Shop.findOne({ link: shopLink });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let cart = await ShopCart.findOne({ userId, shopId: shop._id });
    if (!cart) {
      cart = new ShopCart({ userId, shopId: shop._id, items: [], totalPrice: 0 });
    }

    const existingItem = cart.items.find((item) => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "",
        quantity,
      });
    }

    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    return NextResponse.json({ message: "Item added to cart", cart });
  } catch (err: any) {
    console.error("🔥 Cart POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🛒 GET — Get current user's cart for this shop
export async function GET(req: Request) {
  try {
    await connectDB();

    const shopLink = extractShopLink(req);
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const shop = await Shop.findOne({ link: shopLink });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const cart = await ShopCart.findOne({ userId, shopId: shop._id }).populate({
      path: "items.productId",
      model: "MarketplaceProduct", // ✅ match your product schema
    });

    return NextResponse.json(cart || { items: [], totalPrice: 0 });
  } catch (err: any) {
    console.error("🔥 Cart GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ➖ PUT — Update item quantity
export async function PUT(req: Request) {
  try {
    await connectDB();

    const shopLink = extractShopLink(req);
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, quantity } = await req.json();

    const shop = await Shop.findOne({ link: shopLink });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const cart = await ShopCart.findOne({ userId, shopId: shop._id });
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) return NextResponse.json({ error: "Item not in cart" }, { status: 404 });

    item.quantity = quantity;
    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    return NextResponse.json({ message: "Cart updated", cart });
  } catch (err: any) {
    console.error("🔥 Cart PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🗑 DELETE — Remove item from cart
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const shopLink = extractShopLink(req);
    const userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await req.json();

    const shop = await Shop.findOne({ link: shopLink });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const cart = await ShopCart.findOne({ userId, shopId: shop._id });
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    cart.totalPrice = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await cart.save();

    return NextResponse.json({ message: "Item removed", cart });
  } catch (err: any) {
    console.error("🔥 Cart DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}






















