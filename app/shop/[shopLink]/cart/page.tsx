"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Trash2, Plus, Minus } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
  quantity: number;
  price: number;
  image?: string;
  name?: string;
}

interface Cart {
  items: CartItem[];
  totalPrice: number;
}

export default function ShopCartPage() {
  const { shopLink } = useParams();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch the current shop's cart
  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/shop/${shopLink}/cart`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Failed to fetch cart");
        return;
      }

      const data = await res.json();
      setCart(data.items ? data : { items: [], totalPrice: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Error loading cart");
    } finally {
      setLoading(false);
    }
  };

  // ➕ Increment / ➖ Decrement item quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const res = await fetch(`/api/shop/${shopLink}/cart`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      if (!res.ok) throw new Error("Failed to update cart");

      // ✅ Update cart locally instead of re-fetching
      setCart((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((item) =>
          item.productId._id === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
        const totalPrice = updatedItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
        return { items: updatedItems, totalPrice };
      });

      toast.success("Cart updated");
    } catch (err) {
      console.error(err);
      toast.error("Error updating cart");
    }
  };

  // 🗑 Remove item from cart
  const removeItem = async (productId: string) => {
    try {
      const res = await fetch(`/api/shop/${shopLink}/cart`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) throw new Error("Failed to remove item");

      // ✅ Update cart locally instead of re-fetching
      setCart((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.filter(
          (item) => item.productId._id !== productId
        );
        const totalPrice = updatedItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        );
        return { items: updatedItems, totalPrice };
      });

      toast.success("Item removed");
    } catch (err) {
      console.error(err);
      toast.error("Error removing item");
    }
  };

  useEffect(() => {
    if (shopLink) fetchCart();
  }, [shopLink]);

  if (loading) return <p className="text-center mt-20">Loading cart...</p>;
  if (!cart || cart.items.length === 0)
    return <p className="text-center mt-20">Your cart is empty.</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Your Cart ({shopLink})
      </h1>

      <div className="bg-white shadow-md rounded-xl p-4 space-y-4">
        {cart.items.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between border-b pb-4"
          >
            <div className="flex items-center space-x-4">
              <img
                src={item.image || item.productId?.images?.[0] || "/placeholder.png"}
                alt={item.name || item.productId?.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h2 className="font-medium">
                  {item.name || item.productId?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  ${item.price?.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  updateQuantity(item.productId._id, item.quantity - 1)
                }
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Minus size={14} />
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() =>
                  updateQuantity(item.productId._id, item.quantity + 1)
                }
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => removeItem(item.productId._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-4">
          <p className="font-semibold">Total:</p>
          <p className="font-semibold">${cart.totalPrice.toFixed(2)}</p>
        </div>

        <button className="w-full bg-blue-600 text-white py-2 mt-4 rounded-lg hover:bg-blue-700">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}



