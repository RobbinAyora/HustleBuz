import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Order from "@/app/models/Order";
import Wallet from "@/app/models/Wallet";
import axios from "axios";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { CheckoutRequestID } = await req.json();
    if (!CheckoutRequestID) {
      return NextResponse.json(
        { error: "Missing CheckoutRequestID" },
        { status: 400 }
      );
    }

    // ✅ Call your stkpushquery endpoint
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const queryRes = await axios.post(
      `${baseUrl}/api/mpesa/stkpushquery`,
      { CheckoutRequestID },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = queryRes.data;
    const resultData = result?.result || {};
    const resultCode = resultData?.ResultCode;
    const resultDesc = resultData?.ResultDesc;

    // ✅ If payment confirmed
    if (resultCode === 0 || resultCode === "0") {
      const metadata = resultData?.CallbackMetadata?.Item || [];

      const amount =
        metadata.find((i: any) => i.Name === "Amount")?.Value || 0;
      const receipt =
        metadata.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value || "";
      const phone =
        metadata.find((i: any) => i.Name === "PhoneNumber")?.Value || "";

      // ✅ Find related order
      const order = await Order.findOne({ CheckoutRequestID });
      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      // ✅ Prevent double-crediting
      if (order.status === "paid") {
        return NextResponse.json({
          success: true,
          message: "Payment already verified",
          order,
        });
      }

      // ✅ Update order
      order.status = "paid";
      order.mpesaReceipt = receipt;
      order.amount = amount;
      order.buyerPhone = phone;
      order.paymentConfirmedAt = new Date();
      await order.save();

      // ✅ Update vendor’s wallet
      let wallet = await Wallet.findOne({ userId: order.vendorId });
      if (!wallet) {
        wallet = await Wallet.create({
          userId: order.vendorId,
          balance: 0,
          transactions: [],
        });
      }

      wallet.balance += amount;
      wallet.transactions.push({
        type: "deposit",
        amount,
        reference: receipt,
        balanceAfter: wallet.balance,
        createdAt: new Date(),
      });

      await wallet.save();

      return NextResponse.json({
        success: true,
        message: "✅ Payment verified, order updated, wallet credited",
        order,
        newBalance: wallet.balance,
      });
    }

    // ❌ Payment failed or still pending
    return NextResponse.json({
      success: false,
      message: resultDesc || "Payment not successful",
      status: resultData?.ResultCode || "unknown",
    });
  } catch (error: any) {
    console.error("❌ Error verifying order payment:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error?.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}


