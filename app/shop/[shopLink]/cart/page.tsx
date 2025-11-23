"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface CartItem {
  _id?: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  vendorId?: string;
}

interface Cart {
  _id: string;
  items: CartItem[];
  totalPrice: number;
}

interface Shop {
  _id: string;
  name: string;
  theme?: {
    primaryColor?: string;
  };
}

export default function CartPage() {
  const { shopLink } = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      }
    };
    checkAuth();
  }, [router]);

  // ✅ Fetch shop + cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const shopRes = await fetch(`/api/public/shop/${shopLink}`);
        if (!shopRes.ok) throw new Error("Failed to fetch shop details");

        const { shop } = await shopRes.json();
        if (!shop?._id) throw new Error("Shop not found");
        setShop(shop);
        setShopId(shop._id);

        const cartRes = await fetch(`/api/shop-cart/${shop._id}`, {
          method: "GET",
          credentials: "include",
        });

        if (!cartRes.ok) {
          setCart(null);
          return;
        }

        const data = await cartRes.json();
        setCart(data);
      } catch (err) {
        console.error("Cart fetch error:", err);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    if (shopLink) fetchCart();
  }, [shopLink]);

  // ✅ Remove item
  const removeItem = async (productId: string) => {
    if (!cart || !shopId) return;

    try {
      const res = await fetch(`/api/shop-cart/${shopId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) throw new Error("Failed to remove item");

      const updated = await res.json();
      setCart(updated.cart || null);
      toast.success("Item removed");
    } catch (err) {
      console.error("Remove item error:", err);
      toast.error("Failed to remove item");
    }
  };

  // ✅ Redirect to checkout
  const handleCheckout = () => {
    if (!shopId) return toast.error("Shop not found");
    router.push(`/checkout?shopId=${shopId}`);
  };

  const primaryColor = shop?.theme?.primaryColor || "#4F46E5";

  if (loading)
    return (
      <div className="flex justify-center items-center h-[80vh] text-gray-500">
        Loading cart...
      </div>
    );

  if (!cart || cart.items.length === 0)
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] text-gray-500">
        <ShoppingCart size={48} className="mb-4" style={{ color: primaryColor }} />
        <p>Your cart is empty.</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4" style={{ color: primaryColor }}>
        Your Cart
      </h2>

      <div className="space-y-4">
        {cart.items.map((item, index) => (
          <div
            key={item._id || `${item.productId}-${index}`}
            className="flex justify-between items-center bg-white p-4 rounded-lg shadow"
            style={{ border: `1px solid ${primaryColor}30` }}
          >
            <div className="flex items-center gap-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded object-cover"
                  style={{ borderColor: `${primaryColor}50` }}
                />
              )}
              <div>
                <p className="font-medium" style={{ color: primaryColor }}>
                  {item.name}
                </p>
                <p className="text-sm text-gray-600">
                  {item.quantity} × KES {item.price.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              type="button" // ✅ Explicit button type
              onClick={() => removeItem(item.productId)}
              className="remove-btn" // ✅ Use CSS class instead of inline style
              aria-label="Remove item" // ✅ Accessible name for screen readers
            >
              <Trash2 size={20} />
            </button>

          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <p className="text-xl font-semibold" style={{ color: primaryColor }}>
          Total: KES {cart.totalPrice.toLocaleString()}
        </p>
        <button
          onClick={handleCheckout}
          className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          style={{ backgroundColor: primaryColor }}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}




























