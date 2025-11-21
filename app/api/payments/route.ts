// app/api/payments/vendor.ts
import { NextApiRequest, NextApiResponse } from "next";

import Payment, { IPayment } from "@/app/models/Payment";
import Order from "@/app/models/Order";
import { connectDB } from "@/app/lib/db";

// GET /api/payments/vendor?vendorId=...
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectDB();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { vendorId } = req.query;

    if (!vendorId || typeof vendorId !== "string") {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    // Step 1: Find all orders for this vendor
    const vendorOrders = await Order.find({ vendor: vendorId }).select("_id");

    const orderIds = vendorOrders.map((order) => order._id);

    // Step 2: Find payments for these orders
    const payments = await Payment.find({ order: { $in: orderIds } })
      .populate("buyer", "name email") // optional, include buyer info
      .populate("order", "products totalAmount") // optional, include order details
      .sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (error) {
    console.error("Vendor payments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
