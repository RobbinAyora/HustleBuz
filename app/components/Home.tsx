'use client';

import { motion } from "framer-motion";
import { ShoppingBag, Store } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 shadow-md bg-white fixed top-0 left-0 w-full z-50">
        <h1 className="text-2xl font-bold text-blue-600">HustleBuz</h1>
        
        <a
          href="/login"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Get Started
        </a>
      </header>

      {/* Hero Section */}
      <section className="pt-32 px-8 text-center bg-gradient-to-b from-blue-50 to-white">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold text-blue-700"
        >
          Discover. Shop. Sell. All in One Place.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="flex justify-center mt-8"
        >
          <Store className="w-24 h-24 md:w-32 md:h-32 text-blue-600 drop-shadow-lg" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto"
        >
          HustleBuz is a growing online marketplace for Kenya where{" "}
          <span className="font-semibold text-blue-600">vendors</span> can create shops and{" "}
          <span className="font-semibold text-blue-600">buyers</span> can easily find products they love.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 flex justify-center space-x-4"
        >
          <a
            href="/login?role=vendor"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center font-medium hover:bg-blue-700 transition"
          >
            <Store className="mr-2 w-5 h-5" /> Start Selling
          </a>
          <a
            href="/login?role=buyer"
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg flex items-center font-medium hover:bg-gray-200 transition"
          >
            <ShoppingBag className="mr-2 w-5 h-5" /> Explore Shops
          </a>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="about" className="px-8 py-16 bg-white">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-blue-700 mb-10"
        >
          Why HustleBuz?
        </motion.h3>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: <Store className="mx-auto text-blue-600 w-12 h-12" />,
              title: "Easy Shop Setup",
              text: "Vendors get personalized dashboards to track sales and customize shops."
            },
            {
              icon: <ShoppingBag className="mx-auto text-blue-600 w-12 h-12" />,
              title: "Marketplace for Everyone",
              text: "Buyers can explore hundreds of shops and products in one place."
            },
            {
              icon: <span className="mx-auto text-blue-600 text-5xl">💳</span>,
              title: "Secure Payments",
              text: "Seamless checkout integrated with M-PESA for both buyers and sellers."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="p-6 rounded-xl shadow hover:shadow-lg transition bg-white"
            >
              {feature.icon}
              <h4 className="mt-4 font-semibold text-lg">{feature.title}</h4>
              <p className="text-gray-600 mt-2">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="shops" className="px-8 py-16 bg-blue-600 text-white text-center">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold"
        >
          Join the HustleBuz Community
        </motion.h3>

        <p className="mt-4 text-lg">
          Whether you’re a vendor looking to grow or a buyer searching for unique products — 
          HustleBuz is for you.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 flex flex-col md:flex-row justify-center items-center gap-4"
        >
         
          {/* WhatsApp Group Button (Not Functional Yet) */}
          <button
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition w-full md:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 32 32"
              fill="currentColor"
            >
              <path d="M16 3C9.373 3 4 8.373 4 15c0 2.61.841 5.033 2.253 7.009L4 29l7.201-2.225C13.141 28.07 14.546 28.5 16 28.5c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.277 0-2.526-.293-3.654-.857l-.26-.134-4.275 1.321 1.39-4.091-.17-.266A9.007 9.007 0 0 1 7 15c0-4.963 4.037-9 9-9s9 4.037 9 9-4.037 10-9 10zm4.672-7.559c-.256-.128-1.514-.748-1.748-.833s-.406-.128-.576.128c-.171.256-.661.833-.812 1.004-.15.17-.298.192-.554.064s-1.077-.397-2.05-1.267c-.757-.675-1.267-1.51-1.418-1.766-.15-.256-.016-.395.113-.522.116-.115.256-.299.384-.448.128-.15.171-.256.256-.427.085-.17.043-.32-.021-.448s-.576-1.387-.789-1.9c-.208-.5-.421-.43-.576-.438l-.493-.01c-.17 0-.448.064-.682.32-.234.256-.895.873-.895 2.133s.917 2.474 1.043 2.644c.128.17 1.805 2.752 4.375 3.86.612.264 1.09.422 1.462.54.614.196 1.173.168 1.616.102.494-.073 1.514-.617 1.727-1.215.213-.598.213-1.111.149-1.215-.064-.106-.234-.17-.49-.299z"/>
            </svg>
            Join WhatsApp
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 bg-gray-100 text-center text-gray-600">
        © {new Date().getFullYear()} HustleBuz. All rights reserved.
      </footer>
    </div>
  );
}





