"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import "react-loading-skeleton/dist/skeleton.css";

interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    vendor?: string; // vendor ObjectId as string
  };
  quantity: number;
  price: number;
}

interface Cart {
  items: CartItem[];
  totalPrice: number;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const shopLink = searchParams.get("shop") || undefined;
  const shopId = searchParams.get("shopId");

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [form, setForm] = useState({ phone: "", paymentMethod: "mpesa" });
  const [checkoutRequestID, setCheckoutRequestID] = useState<string | null>(null);
  const [savedOrders, setSavedOrders] = useState<{ [key: string]: boolean }>({}); // ✅ NEW

  const cartApi = shopId ? `/api/shop-cart/${shopId}` : `/api/cart`;

  // ✅ Fetch Cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const res = await fetch(cartApi, { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();
        setCart(data.items ? data : { items: [], totalPrice: 0 });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [shopLink]);

  // ✅ Save Order to Database
  const saveOrder = async (orderPayload: any, CheckoutRequestID: string) => {
    try {
      const firstVendor = orderPayload.cart[0]?.vendor;
      if (!firstVendor) console.warn("⚠️ No vendor found in cart items.");

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: firstVendor || null,
          buyerId: orderPayload.buyerId,
          buyerPhone: orderPayload.mpesa_number,
          items: orderPayload.cart,
          amount: orderPayload.amount,
          CheckoutRequestID,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Order saved successfully:", data);
        toast.success("🧾 Order saved successfully!");
      } else {
        console.error("❌ Failed to save order:", data);
        toast.error("❌ Failed to save order.");
      }
    } catch (error) {
      console.error("❌ Order save error:", error);
      toast.error("Error saving order to database.");
    }
  };

  // ✅ Poll M-Pesa Query + Save Order on Success
  const pollPaymentStatus = async (checkoutRequestID: string, orderPayload: any) => {
    let attempts = 0;
    const maxAttempts = 8;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch("/api/mpesa/stk-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ CheckoutRequestID: checkoutRequestID }),
        });

        const data = await res.json();
        const paymentStatus = data?.result?.status;

        if (paymentStatus === "PAID") {
          clearInterval(interval);
          toast.dismiss();
          toast.success("🎉 Payment confirmed!");
          setShowConfetti(true);

          if (!savedOrders[checkoutRequestID]) {
            await saveOrder(orderPayload, checkoutRequestID);
            setSavedOrders((prev) => ({ ...prev, [checkoutRequestID]: true }));
          }

          setTimeout(() => setShowConfetti(false), 6000);
          setTimeout(() => window.location.reload(), 4000);
        } else if (paymentStatus === "FAILED") {
          clearInterval(interval);
          toast.dismiss();
          toast.error("❌ Payment failed or cancelled.");
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.dismiss();
          toast.error("⚠️ Payment confirmation timed out.");
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(interval);
        toast.error("Error confirming payment.");
      }
    }, 5000);
  };

  // ✅ Handle Checkout
  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error("🛒 Your cart is empty!");
      return;
    }
    if (!form.phone) {
      toast.error("📞 Please enter your phone number");
      return;
    }

    try {
      setSubmitting(true);
      toast.dismiss();

      const orderId = `order-${Date.now()}`;
      const payload = {
        mpesa_number: form.phone,
        amount: cart.totalPrice,
        _id: orderId,
        buyerId: "66c12f93f3b1d245e8f3d123",
        cart: cart.items.map((item) => ({
          productId: item.productId._id,
          name: item.productId.name,
          quantity: item.quantity,
          price: item.price,
          vendor: item.productId.vendor,
        })),
      };

      const stkRes = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const stkData = await stkRes.json();
      if (!stkRes.ok || !stkData.success) {
        toast.error(stkData.message || "Failed to initiate M-Pesa payment");
        setSubmitting(false);
        return;
      }

      toast.success("📲 Check your phone and enter your M-Pesa PIN");
      toast("✅ Waiting for payment confirmation...", { icon: "⏳" });

      const requestID = stkData.data.CheckoutRequestID;
      setCheckoutRequestID(requestID);

      pollPaymentStatus(requestID, payload);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.dismiss();
      toast.error("💥 Error processing payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SkeletonTheme baseColor="#e0e7ff" highlightColor="#c7d2fe">
        <motion.div
          className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
            <Skeleton height={40} width="40%" borderRadius="0.5rem" />
          </div>
        </motion.div>
      </SkeletonTheme>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-blue-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-500 text-lg">
            Your cart is empty.{" "}
            <a
              href={shopLink ? `/shop/${shopLink}` : "/marketplace"}
              className="text-blue-600 underline"
            >
              Go shopping
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 py-10 px-4 overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-2xl p-8 border border-blue-100">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-10">
          Checkout {shopLink ? `for ${shopLink}` : ""}
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Buyer Info */}
          <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Buyer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="07XX XXX XXX"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
              <div>
                {/* ✅ Added accessible label for select */}
                <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  value={form.paymentMethod || ""}
                  disabled
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                >
                  <option value="mpesa">M-Pesa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Order Summary</h2>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between border-b border-blue-100 pb-3"
                >
                  <div>
                    <p className="font-medium">{item.productId.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × KSH.{item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-blue-700">
                    KSH.{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="flex justify-between font-semibold text-lg pt-4 border-t border-blue-200">
                <p>Total:</p>
                <p className="text-blue-700">KSH.{cart.totalPrice.toFixed(2)}</p>
              </div>
            </div>

            <motion.button
              onClick={handleCheckout}
              disabled={submitting}
              className={`w-full mt-6 py-3 text-white rounded-lg font-semibold text-lg transition-all duration-300 shadow-md ${
                submitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {submitting ? "Processing..." : "Pay with M-Pesa"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}































