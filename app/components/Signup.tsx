"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Store, ShoppingBag } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "buyer";

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    // Show loading toast
    toast.loading("⚡ Setting up free plan...", { id: "signup-process" });

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("✅ Signup successful!", { id: "signup-process" });

      // Redirect based on role
      setTimeout(() => {
        if (role === "vendor") router.push("/dashboard");
        else router.push("/marketplace");
      }, 1200);
    } else {
      toast.error(data.message || "❌ Signup failed", { id: "signup-process" });
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Toast container */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col items-center w-1/3 bg-blue-600 text-white p-10 rounded-r-3xl shadow-lg">
        <div className="mb-6">
          {role === "vendor" ? (
            <Store className="w-16 h-16 text-white" />
          ) : (
            <ShoppingBag className="w-16 h-16 text-white" />
          )}
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {role === "vendor" ? "Vendor Hub" : "Buyer Hub"}
        </h2>
        <p className="text-center text-blue-100">
          Manage your business, track sales, and explore products with HustleHub.
        </p>
      </aside>

      {/* Signup Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md border border-gray-100"
        >
          {/* Hidden dummy fields to prevent autofill */}
          <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
          <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />

          <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">
            {role === "vendor" ? "Vendor Signup" : "Buyer Signup"}
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Create your account to get started
          </p>

          <div className="space-y-4">
            <input
              type="text"
              name="name"
              autoComplete="new-name"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              name="email"
              autoComplete="new-email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSignup}
              className="bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Sign Up
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-2 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <a
              href={`/login?role=${role}`}
              className="text-blue-600 font-semibold hover:underline"
            >
              Login
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}






