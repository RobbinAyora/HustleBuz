"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, Trash2, CreditCard } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ----------------------
// TYPES
// ----------------------
interface CartItem {
  _id: string;
  productId: string; // ObjectId string
  vendorId: string; // ObjectId string
  name: string;
  price: number;
  quantity: number;
}

interface FetchCartResponse {
  items: Array<{
    _id: string;
    productId: string | { _id: string; vendor?: { _id: string } ; name?: string; price?: number };
    vendorId?: string;
    name?: string;
    price?: number;
    quantity?: number;
  }>;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const params = useParams() as { shopLink?: string };
  const router = useRouter();
  const shopLink = params?.shopLink;

  // ✅ Load cart items
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const apiUrl = shopLink ? `/api/shop/${shopLink}/cart` : `/api/cart`;
        const res = await fetch(apiUrl, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch cart");

        const data: FetchCartResponse = await res.json();

        const items: CartItem[] = (data.items || []).map((item) => ({
          _id: item._id,
          productId:
            typeof item.productId === "object" ? item.productId._id : item.productId,
          vendorId:
            item.vendorId ||
            (typeof item.productId === "object" && item.productId.vendor?._id) ||
            "unknown_vendor",
          name:
            item.name ||
            (typeof item.productId === "object" && item.productId.name) ||
            "Unknown Product",
          price:
            item.price ||
            (typeof item.productId === "object" && item.productId.price) ||
            0,
          quantity: item.quantity || 1,
        }));

        setCart(items);
      } catch (error) {
        console.error("Cart fetch error:", error);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [shopLink]);

  // ✅ Delete item
  const handleDelete = async (item: CartItem) => {
    try {
      setDeleting(item._id);
      const apiUrl = shopLink
        ? `/api/shop/${shopLink}/cart/${item.productId}?vendorId=${item.vendorId}`
        : `/api/cart/${item.productId}?vendorId=${item.vendorId}`;

      const res = await fetch(apiUrl, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      setCart((prev) => prev.filter((i) => i._id !== item._id));
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error removing item");
    } finally {
      setDeleting(null);
    }
  };

  // ✅ Checkout — Redirect to checkout page
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setCheckingOut(true);

    try {
      sessionStorage.setItem("checkoutCart", JSON.stringify(cart));
      toast.success("Redirecting to checkout...");
      setTimeout(() => {
        router.push("/checkout");
      }, 800);
    } catch (error) {
      console.error("Checkout redirect error:", error);
      toast.error("Error redirecting to checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
        <ShoppingBag className="w-12 h-12 animate-bounce mb-4" />
        <p className="text-lg font-medium">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8 flex flex-col items-center">
      <Toaster position="top-center" />

      <header className="flex items-center mb-10">
        <ShoppingBag className="w-8 h-8 text-blue-600 mr-2" />
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-wide">
          HustleBuz Checkout
        </h1>
      </header>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-10 flex flex-col gap-8">
        <h2 className="text-2xl font-semibold text-blue-700 border-b pb-3">
          Your Order
        </h2>

        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Your cart is empty.</p>
        ) : (
          <div className="space-y-5">
            {cart.map((item) => (
              <div
                key={item._id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center border rounded-xl p-4 shadow-sm hover:shadow-md transition-all bg-white"
              >
                <div className="flex flex-col">
                  <p className="font-semibold text-lg text-gray-800">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm text-blue-600 font-bold">
                    Ksh. {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(item)}
                  disabled={deleting === item._id}
                  className="mt-3 md:mt-0 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting === item._id ? (
                    <span className="animate-pulse text-sm">Deleting...</span>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-lg font-medium text-gray-700">Total</p>
            <p className="text-2xl font-bold text-blue-700">
              Ksh. {total.toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {checkingOut ? (
              <span className="animate-pulse">Redirecting...</span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Proceed to Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


























