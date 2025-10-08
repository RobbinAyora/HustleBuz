"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Vendor {
  name: string;
  email: string;
  phoneNumber?: string;
  image?: string;
}

export default function Profile() {
  const [vendor, setVendor] = useState<Vendor>({
    name: "",
    email: "",
    phoneNumber: "",
    image: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/vendor/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setVendor({
          name: data.name || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          image: data.image || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendor({ ...vendor, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVendor((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendor),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      const updated = await res.json();
      setVendor({
        name: updated.name,
        email: updated.email,
        phoneNumber: updated.phoneNumber || "",
        image: updated.image || "",
      });
      alert("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <motion.div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>

      {/* Profile Image */}
      <div className="flex flex-col items-center mb-6">
        {vendor.image ? (
          <img
            src={vendor.image}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-3 border"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 mb-3 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        <label className="cursor-pointer text-blue-600 hover:underline">
          Upload Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={vendor.name}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={vendor.email}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={vendor.phoneNumber}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-xl transition font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}









