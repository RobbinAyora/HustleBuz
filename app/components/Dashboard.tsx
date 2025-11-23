"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Package, CreditCard, Settings, BarChart, Store } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Profile from "./Profile";
import Product from "./Product";
import Shop from "./Shop";
import Order from "./Order";
import Wallet from "./Wallet";

// ----------------------
// TYPES
// ----------------------
interface VendorProduct {
  id: string;
  name: string;
}

interface VendorOrder {
  productId: string;
}

interface Vendor {
  name: string;
  products?: VendorProduct[];
  orders?: VendorOrder[];
  totalSales?: number;
}

interface Subscription {
  trialActive?: boolean;
  plan?: string;
}

export default function Dashboard() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();

  const handleMarketplaceRedirect = () => {
    toast.success("Redirecting to Marketplace...");
    setTimeout(() => router.push("/marketplace"), 1000); // 1s delay for toast to show
  };

  // Chart data for orders: number of orders per product
  const ordersChartData =
    vendor?.products?.map((p) => {
      const ordersCount = vendor.orders?.filter((o) => o.productId === p.id)
        .length;
      return { name: p.name, orders: ordersCount || 0 };
    }) || [];

  useEffect(() => {
    const fetchVendorAndSubscription = async () => {
      try {
        const res = await fetch("/api/vendor/me", { credentials: "include" });

        if (res.status === 401) return;

        if (res.ok) {
          const data = await res.json();
          setVendor(data.data as Vendor);

          const subRes = await fetch("/api/subscription/check", {
            credentials: "include",
          });

          const subData = await subRes.json();
          setSubscription(subData as Subscription);
        }
      } catch (err) {
        console.error("❌ Failed to load vendor or subscription data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorAndSubscription();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <motion.div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-red-600 font-semibold">Unable to load vendor data.</p>
      </div>
    );
  }

  const sidebarButton = (icon: React.ReactNode, label: string, tab: string) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setSidebarOpen(false);
      }}
      className={`flex items-center gap-3 p-3 w-full rounded-xl transition text-sm font-medium ${
        activeTab === tab
          ? "bg-blue-100 text-blue-700 font-semibold"
          : "text-gray-700 hover:bg-blue-50"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* MOBILE/TABLET TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-50 z-50 p-4 flex justify-between items-center shadow">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Sidebar"
          className="bg-blue-600 p-2 rounded-lg text-white shadow"
        >
          <motion.div
            initial={false}
            animate={{ rotate: sidebarOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M9 3v18" />
            </svg>
          </motion.div>
        </button>

        <button
          onClick={handleMarketplaceRedirect}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow"
        >
          Go to Marketplace
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen md:h-[100vh] w-72 bg-white rounded-r-2xl p-6 flex flex-col justify-between shadow-lg z-40 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="overflow-y-auto flex-1">
          <h2 className="text-2xl font-bold text-blue-700 mb-10">Vendor Panel</h2>
          <nav className="space-y-3">
            {sidebarButton(<BarChart className="w-5 h-5" />, "Dashboard", "dashboard")}
            {sidebarButton(<Package className="w-5 h-5" />, "Products", "products")}
            {sidebarButton(<Package className="w-5 h-5" />, "Orders", "orders")}
            {sidebarButton(<CreditCard className="w-5 h-5" />, "Wallet", "wallet")}
            {sidebarButton(<Store className="w-5 h-5" />, "Shop", "shop")}
            {sidebarButton(<Settings className="w-5 h-5" />, "Settings", "settings")}
          </nav>
        </div>

        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl shadow mt-8">
          <p className="text-sm font-medium">Plan:</p>
          <p className="text-lg font-bold">
            {subscription?.trialActive ? "Free Trial" : subscription?.plan || "Free"}
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen mt-16 md:mt-0">
        {/* DESKTOP HEADER */}
        <header className="hidden md:flex justify-between items-center mb-8 sticky top-0 z-30 pb-4 
          backdrop-blur-md bg-white/40 rounded-2xl p-6 shadow-sm border border-white/20">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome, <span className="text-blue-700">{vendor.name}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your shop, payments, and performance
            </p>
          </div>

          <button
            onClick={handleMarketplaceRedirect}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition text-sm"
          >
            Go to Marketplace
          </button>
        </header>

        {/* MOBILE HEADER */}
        <header className="md:hidden mb-8 backdrop-blur-md bg-white/40 rounded-2xl p-4 shadow-sm border border-white/20">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, <span className="text-blue-700">{vendor.name}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your shop, payments, and performance
          </p>
        </header>

        {/* DASHBOARD CONTENT */}
        {activeTab === "dashboard" && (
          <>
            {subscription?.trialActive && (
              <div className="bg-blue-100 border-l-4 border-blue-600 text-blue-700 p-4 rounded-xl mb-8 shadow text-sm">
                🎉 You are on a <strong>1-month free trial</strong> as an early vendor!
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
              <div className="bg-white rounded-2xl shadow p-4 md:p-6 flex flex-col gap-1 hover:shadow-lg transition">
                <BarChart className="w-6 h-6 text-blue-600 mb-1" />
                <h3 className="text-xs md:text-sm font-medium text-gray-500">Products</h3>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  {vendor.products?.length || 0}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow p-4 md:p-6 flex flex-col gap-1 hover:shadow-lg transition">
                <CreditCard className="w-6 h-6 text-green-600 mb-1" />
                <h3 className="text-xs md:text-sm font-medium text-gray-500">Total Sales</h3>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  Ksh.{vendor.totalSales || 0}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow p-4 md:p-6 flex flex-col gap-1 hover:shadow-lg transition">
                <Package className="w-6 h-6 text-orange-600 mb-1" />
                <h3 className="text-xs md:text-sm font-medium text-gray-500">Orders</h3>
                <p className="text-lg md:text-2xl font-bold text-gray-800">
                  {vendor.orders?.length || 0}
                </p>
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-2xl shadow p-6 mb-10">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Orders per Product</h2>
              {ordersChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ReBarChart data={ordersChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3b82f6" />
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm">No orders data yet.</p>
              )}
            </div>
          </>
        )}

        {activeTab === "products" && <Product />}
        {activeTab === "orders" && <Order />}
        {activeTab === "wallet" && <Wallet />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "shop" && <Shop />}

        {activeTab === "settings" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <p className="text-gray-500 text-sm">Vendor settings coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}



























