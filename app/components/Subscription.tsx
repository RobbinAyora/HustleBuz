"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { Loader2 } from "lucide-react";

export default function Subscription() {
  const router = useRouter();

  const [plan, setPlan] = useState<string | null>(null);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const handleSubscribe = async () => {
    if (!mpesaNumber.startsWith("254") && !mpesaNumber.startsWith("07")) {
      toast.error("Enter a valid M-Pesa number (start with 254 or 07)");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mpesa_number: mpesaNumber,
          plan,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Payment initiation failed");
        setLoading(false);
        return;
      }

      toast.success("STK push sent! Check your phone to complete payment.");
      setLoading(false);
      setVerifying(true);
      setShowModal(false);

      // Wait 20 seconds before checking payment status
      setTimeout(
        () => verifyPayment(data.subscriptionId, data.data.CheckoutRequestID),
        20000
      );
    } catch (error: any) {
      toast.error("Something went wrong.");
      setLoading(false);
    }
  };

  const verifyPayment = async (subscriptionId: string, checkoutRequestID: string) => {
    try {
      const res = await fetch("/api/mpesa/stk-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, checkoutRequestID }),
      });

      const data = await res.json();

      if (data.result?.status === "PAID") {
        toast.success("Subscription activated!");
        setConfetti(true);
        setTimeout(() => router.push("/dashboard"), 4000);
      } else if (data.result?.status === "PENDING") {
        toast("Payment still pending. Retrying...");
        setTimeout(() => verifyPayment(subscriptionId, checkoutRequestID), 10000);
      } else if (data.result?.status === "FAILED") {
        toast.error("Payment failed. Please try again.");
      } else {
        toast.error("Error verifying payment.");
      }
    } catch (error: any) {
      toast.error("Error verifying payment.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-6 relative">
      {confetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      <h1 className="text-3xl font-semibold text-blue-800 mb-6">
        Choose Your Subscription Plan
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Weekly Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-blue-200 hover:shadow-xl transition">
          <h2 className="text-xl font-semibold text-blue-700 mb-2">Weekly Plan</h2>
          <p className="text-gray-600 mb-4">Access all features for 7 days.</p>
          <p className="text-3xl font-bold text-blue-800 mb-6">KES 1</p>
          <button
            onClick={() => {
              setPlan("weekly");
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-full transition"
          >
            Pay Now
          </button>
        </div>

        {/* Monthly Plan Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-blue-200 hover:shadow-xl transition">
          <h2 className="text-xl font-semibold text-blue-700 mb-2">Monthly Plan</h2>
          <p className="text-gray-600 mb-4">Access all features for 30 days.</p>
          <p className="text-3xl font-bold text-blue-800 mb-6">KES 2</p>
          <button
            onClick={() => {
              setPlan("monthly");
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-full transition"
          >
            Pay Now
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-blue-800 mb-4 text-center">
              Enter M-Pesa Number
            </h2>
            <input
              type="tel"
              placeholder="2547XXXXXXXX or 07XXXXXXXX"
              className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none mb-4"
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value)}
            />

            <button
              onClick={handleSubscribe}
              disabled={loading || verifying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Sending STK...
                </>
              ) : verifying ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Verifying Payment...
                </>
              ) : (
                "Confirm Payment"
              )}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-blue-600 mt-3 font-medium hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


