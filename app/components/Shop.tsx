"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaStore, FaCopy } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import toast, { Toaster } from "react-hot-toast";

interface Shop {
  name: string;
  contact: string;
  logo?: string;
  link?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    layout: "classic" | "modern" | "minimal";
  };
}

const DEFAULT_SHOP: Shop = {
  name: "",
  contact: "",
  logo: "",
  link: "",
  theme: {
    primaryColor: "#1D4ED8",
    secondaryColor: "#FFFFFF",
    accentColor: "#FBBF24",
    layout: "classic",
  },
};

export default function Shop() {
  const [shop, setShop] = useState<Shop>(DEFAULT_SHOP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fullShopLink = shop.link ? `${window.location.origin}/shop/${shop.link}` : "";

  // Fetch vendor shop
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/vendor/shop`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch shop");
        const data = await res.json();
        const themeData = data.shop?.theme || DEFAULT_SHOP.theme;

        setShop({
          name: data.shop?.name || "",
          contact: data.shop?.contact || "",
          logo: data.shop?.logo || "",
          link: data.shop?.link || "",
          theme: {
            primaryColor: themeData.primaryColor || "#1D4ED8",
            secondaryColor: themeData.secondaryColor || "#FFFFFF",
            accentColor: themeData.accentColor || "#FBBF24",
            layout: themeData.layout || "classic",
          },
        });
      } catch (err) {
        toast.error("Failed to load shop data");
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShop((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" && {
        link: value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      }),
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setShop((prev) => ({ ...prev, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setShop((prev) => ({
      ...prev,
      theme: { ...prev.theme, primaryColor: color },
    }));
  };

  // Save shop
  const handleSave = async () => {
    setSaving(true);
    toast.loading("Saving shop...", { id: "save" });

    try {
      const res = await fetch("/api/vendor/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(shop),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      setShop((prev) => ({
        ...prev,
        name: data.shop?.name || prev.name,
        contact: data.shop?.contact || prev.contact,
        logo: data.shop?.logo || prev.logo,
        link: data.shop?.link || prev.link,
        theme: { ...prev.theme, ...(data.shop?.theme || {}) },
      }));

      toast.success("Shop saved successfully!", { id: "save" });
    } catch (err: any) {
      toast.error("Error saving shop: " + err.message, { id: "save" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (fullShopLink) {
      navigator.clipboard.writeText(fullShopLink);
      toast.success(`Shop link copied: ${fullShopLink}`);
    }
  };

  const visitShop = () => {
    if (fullShopLink) {
      toast.loading("Redirecting to your shop...", { id: "visit" });
      setTimeout(() => {
        toast.dismiss("visit");
        window.open(fullShopLink, "_blank");
      }, 800);
    } else {
      toast.error("Please save your shop first!");
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Toaster />

      <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3 text-blue-700">
        <FaStore size={36} /> Setup Your Shop
      </h2>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        {loading ? (
          <Skeleton circle height={144} width={144} />
        ) : shop.logo ? (
          <img
            src={shop.logo}
            alt="Shop Logo"
            className="w-36 h-36 rounded-full mb-3 shadow-md border"
          />
        ) : (
          <div className="w-36 h-36 bg-gray-200 rounded-full mb-3 flex items-center justify-center text-gray-400 border">
            No Logo
          </div>
        )}

        {!loading && (
          <>
            <label htmlFor="logo-upload" className="cursor-pointer text-blue-600 hover:underline">
              Upload Logo
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <Skeleton height={50} />
        ) : (
          <input
            type="text"
            name="name"
            placeholder="Shop Name"
            value={shop.name}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />
        )}

        {loading ? (
          <Skeleton height={50} />
        ) : (
          <input
            type="text"
            name="contact"
            placeholder="Contact Info"
            value={shop.contact}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
          />
        )}

        <div>
          {loading ? (
            <Skeleton height={50} />
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={fullShopLink}
                readOnly
                className="border p-3 w-full rounded-lg bg-gray-100"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
              >
                <FaCopy className="mr-1" /> Copy
              </button>
            </div>
          )}
        </div>

        {/* Theme Picker */}
        {loading ? (
          <Skeleton height={50} />
        ) : (
          <div className="sm:col-span-2 flex items-center gap-4">
            <input
              type="color"
              value={shop.theme.primaryColor}
              onChange={handleThemeChange}
              className="w-12 h-12 cursor-pointer border-none p-0"
            />
            <span className="text-gray-700 font-semibold">{shop.theme.primaryColor}</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        {loading ? (
          <Skeleton height={50} className="flex-1" />
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Shop"}
          </button>
        )}

        {loading ? (
          <Skeleton height={50} className="flex-1" />
        ) : (
          <button
            onClick={visitShop}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
          >
            Visit Shop
          </button>
        )}
      </div>
    </motion.div>
  );
}









