"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Store, ShoppingBag } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import "./Login.css"; // ✅ Added external CSS import for hidden inputs

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const role = searchParams.get("role") || "buyer";
  const nextUrl = searchParams.get("redirect") || ""; // ✅ Capture the next URL

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    toast.loading("🔍 Logging in...", { id: "login-process" });

    try {
      const res = await fetch(`/api/auth/login?next=${encodeURIComponent(nextUrl)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Login successful!", { id: "login-process" });

        if (nextUrl) {
          router.push(nextUrl);
          return;
        }

        if (data.role === "vendor") {
          const subRes = await fetch("/api/subscription/check", { credentials: "include" });
          const subData = await subRes.json();

          if (subData.paid || subData.trialActive) {
            router.push("/dashboard");
          } else {
            router.push("/subscriptions");
          }
        } else {
          router.push("/marketplace");
        }
      } else {
        toast.error(data.message || "❌ Login failed", { id: "login-process" });
      }
    } catch (err) {
      console.error("❌ Error during login:", err);
      toast.error("❌ An error occurred during login", { id: "login-process" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <Toaster position="top-center" reverseOrder={false} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        {/* Dummy hidden fields to prevent autofill */}
      {/* Dummy hidden fields to prevent autofill */}
<input
  type="text"
  name="fakeusernameremembered"
  className="hidden-input"
  aria-hidden="true"
  tabIndex={-1}
/>
<input
  type="password"
  name="fakepasswordremembered"
  className="hidden-input"
  aria-hidden="true"
  tabIndex={-1}
/>


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
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              autoComplete="new-email"
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

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
            href={`/signup?role=${role}${nextUrl ? `&next=${encodeURIComponent(nextUrl)}` : ""}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up here
          </a>
        </p>
      </motion.div>
    </div>
  );
}







