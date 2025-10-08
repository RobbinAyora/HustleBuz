"use client";

import { useEffect, useState } from "react";
import { Package, ShoppingBag, Loader2 } from "lucide-react";

interface OrderItem {
  product: { name: string; price: number };
  quantity: number;
}

interface Order {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          credentials: "include", // ✅ include cookies
        });

        if (res.status === 401) {
          setError("Unauthorized. Please log in again.");
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Failed to fetch orders.");
          setLoading(false);
          return;
        }

        setOrders(data.orders || []);
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong while fetching orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ✅ Loading state
  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700">
        <Loader2 className="animate-spin w-8 h-8 mb-3" />
        <p>Loading your orders...</p>
      </div>
    );

  // ✅ Error state
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-red-600">
        <p>{error}</p>
      </div>
    );

  // ✅ Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 flex items-center gap-2">
        <ShoppingBag className="w-7 h-7" /> Vendor Orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-blue-500 text-center mt-12">No orders yet.</p>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border border-blue-200 rounded-2xl p-5 bg-white hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-blue-800">
                  Order #{order._id.slice(-6).toUpperCase()}
                </h2>
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    order.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-blue-100 pb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-800 font-medium">
                        {item.product?.name || "Unnamed Product"}
                      </span>
                    </div>
                    <span className="text-blue-700">
                      {item.quantity} × Ksh. {item.product?.price ?? 0}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 flex justify-between text-blue-700 font-semibold">
                <span>Total:</span>
                <span>Ksh. {order.total.toFixed(2)}</span>
              </div>

              <p className="text-sm text-blue-400 mt-2">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

