"use client";

import { useParams, useRouter } from "next/navigation";
import { ShoppingBag, Package, Store } from "lucide-react";
import React, { useEffect, useState } from "react"; // Removed unused searchRef
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image"; // ✅ Import next/image

interface Shop {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  owner: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock?: number;
  images?: string[];
  description?: string;
  categories?: string[];
}

export default function ShopPage() {
  const router = useRouter();
  const params = useParams();
  const shopLink = params.shopLink as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<{ [key: string]: boolean }>({});
  const [cartCount, setCartCount] = useState(0);

  // 🟢 Fetch shop + products
  useEffect(() => {
    if (!shopLink) return;

    const fetchShopAndProducts = async () => {
      try {
        setLoading(true);
        const shopRes = await fetch(`/api/public/shop/${shopLink}`);
        const shopData: { shop?: Shop; message?: string } = await shopRes.json();

        if (!shopRes.ok || !shopData?.shop) {
          throw new Error(shopData?.message || "Shop not found");
        }

        setShop(shopData.shop);

        const productsRes = await fetch(
          `/api/products?vendor=${shopData.shop.owner}`
        );
        const productsData: { products?: Product[] } | Product[] = await productsRes.json();

        const productList: Product[] = Array.isArray(productsData)
          ? productsData
          : productsData.products || [];

        setProducts(productList);
        setFilteredProducts(productList);
      } catch (err: unknown) {
        // ✅ Proper typing instead of any
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load shop or products";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndProducts();
  }, [shopLink]);

  // 🟢 Search filter
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query);
      const categoryMatch = p.categories?.some((c) =>
        c.toLowerCase().includes(query)
      );
      return nameMatch || descMatch || categoryMatch;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // 🟢 Add to cart (cookie-based)
  const handleAddToCart = async (productId: string) => {
    if (!shop) return;

    const product = products.find((p) => p._id === productId);
    if (!product) {
      toast.error("Product not found");
      return;
    }

    setAdding((prev) => ({ ...prev, [productId]: true }));

    try {
      const res = await fetch(`/api/shop-cart/${shop._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
          vendorId: shop.owner,
        }),
      });

      if (res.status === 401) {
        toast.error("Please log in to add items to cart");
        const redirectUrl = encodeURIComponent(`/shop/${shopLink}`);
        router.push(`/login?role=buyer&redirect=${redirectUrl}`);
        return;
      }

      const data: { message?: string } = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to add to cart");

      toast.success("Added to cart!");
      setCartCount((prev) => prev + 1);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add to cart";
      toast.error(errorMessage);
    } finally {
      setAdding((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!shop) return <p className="text-center mt-20">Shop not found</p>;

  const primaryColor = shop.theme?.primaryColor || "#4F46E5";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            {shop.logo ? (
              <Image
                src={shop.logo}
                alt={shop.name}
                width={48}
                height={48}
                className="rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <Store className="w-12 h-12 text-gray-600" />
            )}
            <div>
              <h1
                className="text-xl md:text-2xl font-bold"
                style={{ color: primaryColor }}
              >
                {shop.name}
              </h1>
              {shop.description && (
                <p className="text-sm text-gray-600">{shop.description}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push(`/shop/${shopLink}/cart`)}
            className="relative flex items-center space-x-2 text-white px-4 py-2 rounded-full hover:scale-105 transition"
            style={{ backgroundColor: primaryColor }}
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

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 bg-white">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="rounded-2xl shadow-lg p-6 flex flex-col transition hover:shadow-xl hover:-translate-y-1 bg-white"
                style={{ border: `1px solid ${primaryColor}30` }}
              >
                <Link href={`/product/${product._id}`}>
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={400}
                      height={160}
                      className="object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div
                      className="h-40 w-full flex items-center justify-center rounded-lg border mb-4"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Package
                        className="w-10 h-10"
                        style={{ color: primaryColor }}
                      />
                    </div>
                  )}
                </Link>

                <h3
                  className="text-lg font-semibold hover:underline"
                  style={{ color: primaryColor }}
                >
                  {product.name}
                </h3>

                <p className="text-gray-600 text-sm mt-1">
                  {product.description?.slice(0, 60) || "No description"}
                </p>

                <p
                  className="font-bold mt-3 text-lg"
                  style={{ color: primaryColor }}
                >
                  Ksh.{product.price.toFixed(2)}
                </p>

                <button
                  onClick={() => handleAddToCart(product._id)}
                  disabled={adding[product._id]}
                  className="mt-4 w-full text-white py-2 rounded-xl font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  {adding[product._id] ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer
        className="py-6 mt-12 text-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <p className="text-sm">
          © {new Date().getFullYear()} {shop.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}































