"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Store, ShoppingBag } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "buyer";

  const handleLogin = async () => {
    // Show initial toast
    if (role === "vendor") {
      toast.loading("🔍 Checking subscription...", { id: "login-process" });
    } else {
      toast.loading("🔍 Logging in...", { id: "login-process" });
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("✅ Login successful!", { id: "login-process" });

      if (data.role === "vendor") {
        const subRes = await fetch("/api/subscription/check", {
          credentials: "include",
        });
        const sub = await subRes.json();

        if (!sub.active) {
          router.push("/subscriptions");
        } else {
          // ✅ Default vendors to dashboard, but they can still go to marketplace later
          router.push("/dashboard");
        }
      } else {
        router.push("/marketplace");
      }
    } else {
      toast.error(data.message || "❌ Login failed", { id: "login-process" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      {/* Toast container */}
      <Toaster position="top-center" reverseOrder={false} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        {/* Dummy hidden fields to prevent autofill */}
        <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
        <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {role === "vendor" ? (
            <Store className="text-blue-600 w-12 h-12" />
          ) : (
            <ShoppingBag className="text-blue-600 w-12 h-12" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-2">
          {role === "vendor" ? "Vendor Login" : "Buyer Login"}
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Welcome back! Please enter your details to continue.
        </p>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="new-email"
            className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-2 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-gray-600">
          Don’t have an account?{" "}
          <a
            href={`/signup?role=${role}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up here
          </a>
        </p>
      </motion.div>
    </div>
  );
}




