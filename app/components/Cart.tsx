"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Trash2, CreditCard } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ✅ Cart item interface
interface CartItem {
  _id: string; // cart item ID (if stored in DB)
  productId: string; // actual product reference
  name: string;
  price: number;
  quantity: number;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // ✅ Load cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();
        setCart(Array.isArray(data) ? data : data.items || []);
      } catch (error) {
        console.error("Cart fetch error:", error);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // ✅ Delete item from cart
  const handleDelete = async (productId: string) => {
    try {
      setDeleting(productId);
      const res = await fetch(`/api/cart/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error removing item");
    } finally {
      setDeleting(null);
    }
  };

  // ✅ Checkout handler
  const handleCheckout = async () => {
    try {
      if (cart.length === 0) {
        toast.error("Cart is empty");
        return;
      }

      setCheckingOut(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItems: cart }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Checkout failed:", data);
        toast.error(data.error || "Checkout failed");
        return;
      }

      toast.success("✅ Checkout successful!");
      console.log("Created orders:", data.createdOrders);

      // Clear cart
      setCart([]);

      // ✅ Stay on the page; vendor dashboard will handle orders display
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  // ✅ Compute total
  const total = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // ✅ Loading view
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

      {/* ✅ Header */}
      <header className="flex items-center mb-10">
        <ShoppingBag className="w-8 h-8 text-blue-600 mr-2" />
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-wide">
          HustleBuz Checkout
        </h1>
      </header>

      {/* ✅ Main Card */}
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
                  onClick={() => handleDelete(item.productId)}
                  disabled={deleting === item.productId}
                  className="mt-3 md:mt-0 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting === item.productId ? (
                    <span className="animate-pulse text-sm">Deleting...</span>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Checkout Section */}
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
              <span className="animate-pulse">Processing...</span>
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

















