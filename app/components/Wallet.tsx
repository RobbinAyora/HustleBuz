"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface VendorData {
  success: boolean;
  message?: string;
  data?: {
    totalSales?: number;
    balance?: number;
  };
}

interface WithdrawResponse {
  success: boolean;
  message?: string;
}

export default function Wallet() {
  const [balance, setBalance] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [mpesa, setMpesa] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch vendor data including totalSales and balance
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await fetch("/api/vendor/me", { credentials: "include" });
        const data: VendorData = await res.json();

        if (res.ok && data.success && data.data) {
          setTotalSales(data.data.totalSales ?? 0);
          setBalance(data.data.balance ?? 0);
        } else {
          toast.error(data.message || "Failed to fetch wallet data");
        }
      } catch (err: any) {
        console.error("❌ Failed to fetch vendor data:", err);
        toast.error("Server error");
      }
    };

    fetchVendor();
  }, []);

  const handleWithdraw = async () => {
    if (!amount || !mpesa) return toast.error("Please fill all fields");

    const withdrawalAmount = Number(amount);
    const deduction = withdrawalAmount * 0.03; // 3% fee
    const finalAmount = withdrawalAmount - deduction;

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, mpesa_number: mpesa }),
      });

      const data: WithdrawResponse = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        toast.success(`Withdrawal successful! Ksh ${finalAmount.toFixed(2)} sent (3% fee applied)`);
        setBalance((prev) => prev - withdrawalAmount); // Deduct full requested amount
        setAmount("");
        setMpesa("");
      } else {
        toast.error(data.message || "Withdrawal failed");
      }
    } catch (err: any) {
      setLoading(false);
      console.error("❌ Withdrawal error:", err);
      toast.error("Server error during withdrawal");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-3xl shadow-lg border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Vendor Wallet</h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-2xl shadow flex flex-col items-center">
          <p className="text-sm text-blue-500">Total Sales</p>
          <p className="text-xl md:text-2xl font-bold text-blue-700">
            Ksh {totalSales.toFixed(2)}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl shadow flex flex-col items-center">
          <p className="text-sm text-blue-500">Available Balance</p>
          <p className="text-xl md:text-2xl font-bold text-blue-700">
            Ksh {balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl shadow">
        <h3 className="font-semibold text-blue-700 mb-4">Withdraw Funds</h3>
        <input
          type="text"
          placeholder="Mpesa number (07... or 254...)"
          value={mpesa}
          onChange={(e) => setMpesa(e.target.value)}
          className="w-full mb-3 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-3 p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-sm text-gray-500 mb-4">
          Note: A 3% transaction fee will be deducted from the amount.
        </p>
        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </div>

      {balance > 0 && (
        <div className="mt-6 bg-blue-100 p-4 rounded-2xl text-blue-700 shadow">
          Remaining Balance after withdrawal: Ksh {balance.toFixed(2)}
        </div>
      )}
    </div>
  );
}




