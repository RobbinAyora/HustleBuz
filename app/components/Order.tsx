"use client";

import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function VendorOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders/vendor", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load orders");

        setOrders(data.data.orders || []);
        setStats(data.data.stats || { totalOrders: 0, totalSales: 0 });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  if (error)
    return (
      <p className="text-center text-red-500 mt-10 font-medium bg-red-50 p-3 rounded-xl shadow-sm w-fit mx-auto">
        Error: {error}
      </p>
    );

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <h1 className="text-3xl font-semibold mb-6 text-blue-700 text-center">
        Vendor Orders
      </h1>

      {/* ====== Summary Cards ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <Skeleton height={100} />
            <Skeleton height={100} />
          </>
        ) : (
          <>
            <div className="bg-white border border-blue-100 shadow-md rounded-xl p-4 text-center hover:shadow-lg transition">
              <h2 className="text-blue-500 text-sm font-medium">Total Orders</h2>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                {stats.totalOrders}
              </p>
            </div>
            <div className="bg-white border border-blue-100 shadow-md rounded-xl p-4 text-center hover:shadow-lg transition">
              <h2 className="text-blue-500 text-sm font-medium">Total Sales</h2>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                KES {stats.totalSales ? stats.totalSales.toLocaleString() : '0'}

              </p>
            </div>
          </>
        )}
      </div>

      {/* ====== Orders Table ====== */}
      <div className="bg-white border border-blue-100 shadow-md rounded-xl p-6 overflow-x-auto">
        {loading ? (
          <div>
            <Skeleton count={1} height={40} />
            <Skeleton count={5} height={35} className="mt-3" />
          </div>
        ) : (
          <table className="min-w-full border border-blue-100 text-sm">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="text-left p-3 border-b border-blue-200">Buyer</th>
                <th className="text-left p-3 border-b border-blue-200">Phone</th>
                <th className="text-left p-3 border-b border-blue-200">Amount</th>
                <th className="text-left p-3 border-b border-blue-200">Status</th>
                <th className="text-left p-3 border-b border-blue-200">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-gray-500 py-6 border-b"
                  >
                    No orders found.
                  </td>
                </tr>
              )}

              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-blue-50 transition duration-150"
                >
                  <td className="p-3 border-b border-blue-100">
                    {order.buyerId?.name || "Unknown"}
                  </td>
                  <td className="p-3 border-b border-blue-100">
                    {order.buyerPhone || "N/A"}
                  </td>
                  <td className="p-3 border-b border-blue-100 text-blue-700 font-medium">
                    KES {order.amount?.toLocaleString() || 0}
                  </td>
                  <td className="p-3 border-b border-blue-100 font-semibold text-green-600 bg-green-50 rounded-lg">
                    ✅ Paid
                  </td>
                  <td className="p-3 border-b border-blue-100 text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}









