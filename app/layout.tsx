import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hustlebuz - Multi-Vendor Campus Marketplace",
  description:
    "Hustlebuz is a multi-vendor platform connecting campus students to local businesses. Discover products, place orders, and support campus entrepreneurs effortlessly.",
  keywords: [
    "Hustlebuz",
    "campus marketplace",
    "student vendors",
    "multi-vendor platform",
    "student shopping",
    "campus businesses",
    "buy and sell",
  ],
  authors: [{ name: "Hustlebuz Team", url: "https://hustlebuz.com" }],
  openGraph: {
    title: "Hustlebuz - Multi-Vendor Campus Marketplace",
    description:
      "Connect with local campus vendors and shop products easily with Hustlebuz.",
    url: "https://hustlebuz.com",
    siteName: "Hustlebuz",
    images: [
      {
        url: "https://hustlebuz.com/logo.png", // Replace with your hosted logo
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hustlebuz - Multi-Vendor Campus Marketplace",
    description:
      "Connect with campus vendors and discover products easily on Hustlebuz.",
    images: ["https://hustlebuz.com/hustleLogo.png"], // Replace with your hosted logo
    site: "@hustlebuz", // your Twitter handle if available
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

