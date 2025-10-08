"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tags, Package, Search, Store, ShoppingCart } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
  categories: string[];
  vendor?: string;
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products?marketplace=true");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching marketplace products:", err);
        toast.error("Failed to load marketplace");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Fetch user's cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();
        setCart(data.items || []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    fetchCart();
  }, []);

  // ✅ Add to cart
  const handleAddToCart = async (product: Product) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
          vendorId: product.vendor,
        }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");
      setCart((prev) => [...prev, product]);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      console.error(err);
      toast.error("Error adding to cart");
    }
  };

  // ✅ Remove from cart
  const handleRemoveFromCart = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to remove item");
      const data = await res.json();
      setCart(data.items || []);
      toast.success("Item removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Error removing item");
    }
  };

  // ✅ Filter products
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.categories.some((cat) => cat.toLowerCase().includes(query))
    );
  });

  // ✅ Suggestions
  const suggestions = Array.from(
    new Set([
      ...products
        .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((p) => p.name),
      ...products
        .flatMap((p) => p.categories)
        .filter((cat) => cat.toLowerCase().includes(searchQuery.toLowerCase())),
    ])
  ).slice(0, 6);

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gray-50 flex flex-col"
    >
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="p-6 flex flex-col gap-4">
        {/* Top Row: Logo & Cart Icon */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Store className="w-8 h-8 text-blue-600" /> HustleBuz
          </h2>

          {/* Cart Icon */}
          <Link href="/cart" className="relative cursor-pointer">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
        </div>

        {/* Search Bar (Below on small, Center on md+) */}
        <div className="relative w-full md:w-96 md:mx-auto">
          <div className="flex items-center bg-white rounded-xl shadow-md px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-300">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search products or categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && searchQuery && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto"
              >
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-sm"
                    onMouseDown={() => handleSelectSuggestion(s)}
                  >
                    {s}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="flex-1 px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-pulse">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4"
              >
                <div className="h-40 w-full bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mt-2"></div>
                <div className="h-8 bg-gray-200 rounded mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-gray-500 text-center mt-12">
            No products match your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg p-6 flex flex-col transition"
              >
                <Link
                  href={`/product/${product._id}`}
                  className="cursor-pointer"
                >
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-40 w-full object-cover rounded-lg border mb-4"
                    />
                  ) : (
                    <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded-lg border mb-4">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </Link>

                <Link
                  href={`/product/${product._id}`}
                  className="cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600">
                    {product.name}
                  </h3>
                </Link>

                <p className="text-gray-500 text-sm mt-1">
                  {product.description?.length > 60
                    ? product.description.slice(0, 60) + "..."
                    : product.description || "No description available"}
                </p>
                <p className="text-blue-600 font-bold mt-3 text-lg">
                  Ksh.{product.price.toFixed(2)}
                </p>
                <p className="text-gray-500 text-sm">Stock: {product.stock}</p>

                {product.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.categories.map((cat, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-md flex items-center gap-1"
                      >
                        <Tags className="w-3 h-3" /> {cat}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-xl transition font-semibold"
                >
                  Add to Cart
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-blue-600 text-white py-6 mt-12 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} HustleBuz. All rights reserved.
        </p>
      </footer>
    </motion.div>
  );
}


















