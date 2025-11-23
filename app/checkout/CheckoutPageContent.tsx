"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import "react-loading-skeleton/dist/skeleton.css";

// ----------------------
// TYPE DEFINITIONS
// ----------------------

interface ProductRef {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  vendor?: string;
}

interface CartItem {
  _id: string;
  productId: ProductRef;
  quantity: number;
  price: number;
}

interface Cart {
  items: CartItem[];
  totalPrice: number;
}

interface StkPushResponse {
  success: boolean;
  message?: string;
  data?: {
    CheckoutRequestID: string;
  };
}

interface StkQueryResponse {
  result?: {
    status?: string; // PAID | FAILED | PENDING
  };
}

interface OrderPayload {
  mpesa_number: string;
  amount: number;
  _id: string;
  buyerId: string;
  cart: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    vendor?: string;
  }>;
}

// -----------------------------------------------------
// COMPONENT
// -----------------------------------------------------

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const shopLink = searchParams.get("shop") ?? undefined;
  const shopId = searchParams.get("shopId");

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    paymentMethod: "mpesa",
  });

  const [checkoutRequestID, setCheckoutRequestID] = useState<string | null>(null);

  const [savedOrders, setSavedOrders] = useState<Record<string, boolean>>({});

  const cartApi = shopId ? `/api/shop-cart/${shopId}` : `/api/cart`;

  // -----------------------------------------------------
  // FETCH CART
  // -----------------------------------------------------
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);

        const res = await fetch(cartApi, {
          method: "GET",
          credentials: "include",
        });

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
  }, [cartApi]);

  // -----------------------------------------------------
  // SAVE ORDER
  // -----------------------------------------------------
  const saveOrder = async (orderPayload: OrderPayload, CheckoutRequestID: string) => {
    try {
      const firstVendor = orderPayload.cart[0]?.vendor ?? null;

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: firstVendor,
          buyerId: orderPayload.buyerId,
          buyerPhone: orderPayload.mpesa_number,
          items: orderPayload.cart,
          amount: orderPayload.amount,
          CheckoutRequestID,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Order saved!");
      } else {
        toast.error("Failed to save order");
        console.error("Order save error:", data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving order");
    }
  };

  // -----------------------------------------------------
  // POLL MPESA STATUS
  // -----------------------------------------------------
  const pollPaymentStatus = async (requestID: string, payload: OrderPayload) => {
    let attempts = 0;
    const maxAttempts = 8;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch("/api/mpesa/stk-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ CheckoutRequestID: requestID }),
        });

        const data: StkQueryResponse = await res.json();
        const status = data?.result?.status;

        if (status === "PAID") {
          clearInterval(interval);
          toast.dismiss();
          toast.success("Payment confirmed!");
          setShowConfetti(true);

          if (!savedOrders[requestID]) {
            await saveOrder(payload, requestID);
            setSavedOrders((prev) => ({ ...prev, [requestID]: true }));
          }

          setTimeout(() => setShowConfetti(false), 6000);
          setTimeout(() => window.location.reload(), 4000);
        }

        if (status === "FAILED") {
          clearInterval(interval);
          toast.dismiss();
          toast.error("Payment failed");
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.dismiss();
          toast.error("Payment timeout");
        }
      } catch (error) {
        clearInterval(interval);
        console.error(error);
        toast.error("Error confirming payment");
      }
    }, 5000);
  };

  // -----------------------------------------------------
  // HANDLE CHECKOUT
  // -----------------------------------------------------
  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!form.phone) {
      toast.error("Enter phone number");
      return;
    }

    try {
      setSubmitting(true);

      const orderId = `order-${Date.now()}`;

      const payload: OrderPayload = {
        mpesa_number: form.phone,
        amount: cart.totalPrice,
        _id: orderId,
        buyerId: "66c12f93f3b1d245e8f3d123", // TODO: Replace with actual user
        cart: cart.items.map((item) => ({
          productId: item.productId._id,
          name: item.productId.name,
          quantity: item.quantity,
          price: item.price,
          vendor: item.productId.vendor,
        })),
      };

      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: StkPushResponse = await res.json();

      if (!res.ok || !data.success || !data.data) {
        toast.error(data.message || "Payment failed");
        setSubmitting(false);
        return;
      }

      const requestID = data.data.CheckoutRequestID;
      setCheckoutRequestID(requestID);

      toast("Waiting for payment confirmation...", { icon: "⏳" });

      pollPaymentStatus(requestID, payload);
    } catch (error) {
      console.error(error);
      toast.error("Payment error");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------------------
  // UI: LOADING
  // -----------------------------------------------------
  if (loading) {
    return (
      <SkeletonTheme baseColor="#e0e7ff" highlightColor="#c7d2fe">
        <div className="p-8">
          <Skeleton height={40} width="40%" />
        </div>
      </SkeletonTheme>
    );
  }

  // -----------------------------------------------------
  // UI: EMPTY CART
  // -----------------------------------------------------
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-blue-50">
        <p className="text-gray-500 text-lg">
          Your cart is empty.{" "}
          <a
            href={shopLink ? `/shop/${shopLink}` : "/marketplace"}
            className="text-blue-600 underline"
          >
            Go shopping
          </a>
        </p>
      </div>
    );
  }

  // -----------------------------------------------------
  // UI: MAIN PAGE
  // -----------------------------------------------------
  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <Toaster />

      <div className="max-w-5xl mx-auto bg-white rounded-2xl p-8 shadow">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
          Checkout {shopLink ? `for ${shopLink}` : ""}
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          {/* PHONE FIELD */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* ORDER SUMMARY */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {cart.items.map((item) => (
              <div key={item._id} className="flex justify-between py-2">
                <p>{item.productId.name}</p>
                <p>KSH {item.price * item.quantity}</p>
              </div>
            ))}

            <p className="font-bold mt-4">
              Total: KSH {cart.totalPrice.toFixed(2)}
            </p>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              {submitting ? "Processing..." : "Pay with M-Pesa"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}