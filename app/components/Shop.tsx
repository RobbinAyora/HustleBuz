"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaStore, FaCopy } from "react-icons/fa";

interface Shop {
  name: string;
  contact: string;
  logo?: string;
  themeColor: string;
  link?: string;
}

const DEFAULT_SHOP: Shop = {
  name: "",
  contact: "",
  logo: "",
  themeColor: "#1D4ED8",
  link: "",
};

export default function Shop() {
  const [shop, setShop] = useState<Shop>(DEFAULT_SHOP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch("/api/vendor/shop");
        if (!res.ok) throw new Error("Failed to fetch shop");
        const data = await res.json();
        setShop({
          name: data.name || "",
          contact: data.contact || "",
          logo: data.logo || "",
          themeColor: data.themeColor || "#1D4ED8",
          link: data.link || "",
        });
      } catch (err) {
        console.error(err);
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
    reader.onloadend = () => {
      setShop((prev) => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShop((prev) => ({ ...prev, themeColor: e.target.value || "#1D4ED8" }));
  };

  const handleCopyLink = () => {
    if (shop.link) {
      navigator.clipboard.writeText(`${window.location.origin}/shop/${shop.link}`);
      alert("Shop link copied to clipboard!");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shop),
      });

      if (!res.ok) throw new Error("Save failed");

      const updated = await res.json();

      setShop({
        name: updated.name || "",
        contact: updated.contact || "",
        logo: updated.logo || "",
        themeColor: updated.themeColor || "#1D4ED8",
        link: updated.link || "",
      });

      alert("Shop saved successfully!");
    } catch (err) {
      alert("Error saving shop");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const visitShop = () => {
    if (shop.link) {
      window.open(`${window.location.origin}/shop/${shop.link}`, "_blank");
    } else {
      alert("Please save your shop first!");
    }
  };

  if (loading) return <div className="text-center py-10">Loading shop...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-12"
    >
      <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3 text-blue-700">
        <FaStore size={36} />
        Setup Your Shop
      </h2>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        {shop.logo ? (
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
        <label className="cursor-pointer text-blue-600 hover:underline" htmlFor="logo-upload">
          Upload Logo
        </label>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <input
          type="text"
          name="name"
          placeholder="Shop Name"
          value={shop.name}
          onChange={handleChange}
          className="border p-3 rounded-lg w-full"
          aria-label="Shop Name"
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact Info"
          value={shop.contact}
          onChange={handleChange}
          className="border p-3 rounded-lg w-full"
          aria-label="Contact Info"
        />

        {/* Shop link & copy */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={shop.link || ""}
            readOnly
            className="border p-3 w-full rounded-lg bg-gray-100"
            aria-label="Shop Link"
          />
          <button
            onClick={handleCopyLink}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
            aria-label="Copy Shop Link"
            type="button"
          >
            <FaCopy className="mr-1" />
            Copy
          </button>
        </div>

        {/* Theme color picker */}
        <div className="sm:col-span-2 flex items-center gap-4">
          <input
            type="color"
            value={shop.themeColor || "#1D4ED8"}
            onChange={handleThemeChange}
            className="w-12 h-12 cursor-pointer border-none p-0"
            aria-label="Theme Color Picker"
          />
          <span className="text-gray-700 font-semibold">{shop.themeColor}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          type="button"
        >
          {saving ? "Saving..." : "Save Shop"}
        </button>
        <button
          onClick={visitShop}
          className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
          type="button"
        >
          Visit Shop
        </button>
      </div>
    </motion.div>
  );
}





