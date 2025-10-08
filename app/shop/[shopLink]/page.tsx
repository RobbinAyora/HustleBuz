'use client';
import { useRouter } from "next/navigation"; // import router
import { ShoppingBag, DollarSign, Package, Store } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ShopPage({ params }: { params: Promise<{ shopLink: string }> }) {
  const { shopLink } = React.use(params);
  const router = useRouter();

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<{ [key: string]: boolean }>({});
  const [cartCount, setCartCount] = useState<number>(0); // cart item count

  // Fetch shop and products
  useEffect(() => {
    const fetchShopAndProducts = async () => {
      try {
        const shopRes = await fetch(`/api/shop/${shopLink}`, { credentials: "include" });
        if (!shopRes.ok) throw new Error("Failed to load shop");
        const { shop } = await shopRes.json();
        setShop(shop);

        const productsRes = await fetch(`/api/products?shop=${shop.owner}`, { credentials: "include" });
        if (!productsRes.ok) throw new Error("Failed to load products");
        const data = await productsRes.json();
        setProducts(data);

        await fetchCartCount(); // fetch cart count when loading shop
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndProducts();
  }, [shopLink]);

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const res = await fetch(`/api/shop/${shopLink}/cart`, { credentials: "include" });
      if (!res.ok) return;
      const cart = await res.json();
      setCartCount(cart?.items?.length || 0);
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  };

  // Add to cart
  const handleAddToCart = async (productId: string) => {
    setAdding((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/shop/${shopLink}/cart`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add to cart");

      toast.success("Added to cart!");
      await fetchCartCount(); // update cart count dynamically
    } catch (err: any) {
      console.error("Add to Cart Error:", err);
      toast.error(err.message || "Failed to add to cart");
    } finally {
      setAdding((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!shop) return <p className="text-center mt-20">Shop not found</p>;

  const themeColor = shop.themeColor || "#4F46E5";

  return (
    <div
      className="min-h-screen flex flex-col text-gray-900"
      style={{ background: `linear-gradient(to bottom, #ffffff, ${themeColor}15)` }}
    >
      <header className="sticky top-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.name}
                className="w-12 h-12 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <Store className="w-12 h-12 text-gray-600" />
            )}
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: themeColor }}>
              {shop.name}
            </h1>
          </div>

          {/* Cart button now navigates to /[shopLink]/cart */}
          <button
            onClick={() => router.push(`/shop/${shopLink}/cart`)}
            className="relative flex items-center space-x-2 text-white px-4 py-2 rounded-full hover:scale-105 transform transition"
            style={{ backgroundColor: themeColor }}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12">
        {products.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition transform hover:-translate-y-2 overflow-hidden group flex flex-col"
              >
                <div className="relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <Package className="w-14 h-14 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg md:text-xl font-bold line-clamp-1 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span
                      className="flex items-center space-x-1 text-xl font-semibold"
                      style={{ color: themeColor }}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>{product.price}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    disabled={adding[product._id]}
                    className="w-full mt-5 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition text-base"
                    style={{ backgroundColor: themeColor }}
                  >
                    {adding[product._id] ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}














