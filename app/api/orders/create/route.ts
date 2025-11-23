import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import mongoose from "mongoose";

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
    console.log("🟢 Incoming order payload:", body);

    let { vendorId, buyerId, buyerPhone, items, amount, CheckoutRequestID } = body;

    // ✅ Flatten vendorId if it's an object
    if (typeof vendorId === "object" && vendorId._id) {
      vendorId = vendorId._id;
    }

    // ✅ Convert vendorId and buyerId to ObjectId (buyerId optional)
    const vendorObjectId = mongoose.Types.ObjectId.isValid(vendorId)
      ? new mongoose.Types.ObjectId(vendorId)
      : null;

    const buyerObjectId =
      buyerId && mongoose.Types.ObjectId.isValid(buyerId)
        ? new mongoose.Types.ObjectId(buyerId)
        : null;

    if (!vendorObjectId) {
      return NextResponse.json(
        { error: "Invalid vendorId" },
        { status: 400 }
      );
    }

    if (!buyerPhone) {
      return NextResponse.json(
        { error: "Buyer phone number is required" },
        { status: 400 }
      );
    }

    // ✅ Ensure all items have proper ObjectIds
    const itemsWithObjectIds = (items || []).map((item: any) => {
      let itemVendorId = item.vendor;

      if (typeof item.vendor === "object" && item.vendor._id) {
        itemVendorId = item.vendor._id;
      }

      return {
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId),
        vendor: new mongoose.Types.ObjectId(itemVendorId),
      };
    });

    // ✅ Create new order (status set to 'paid')
    const order = await Order.create({
      vendorId: vendorObjectId,
      buyerId: buyerObjectId, // optional
      buyerPhone,             // required for M-PESA payments
      items: itemsWithObjectIds,
      amount,
      CheckoutRequestID,
      status: "paid", // status is "paid" because this is post-payment
    });

    console.log("✅ Order created successfully:", order);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("❌ Error creating order:", error.message || error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  }
}


