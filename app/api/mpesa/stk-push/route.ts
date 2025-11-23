import { NextResponse } from "next/server";
import axios, { AxiosResponse } from "axios";
import { connectDB } from "@/app/lib/db";
import CheckoutSession from "@/app/models/CheckoutSession";
import SubscriptionPayment from "@/app/models/SubscriptionPayment";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { mpesa_number, amount, _id, purpose = "order", cart } = body;

    if (!mpesa_number || !amount || !_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const mpesaEnv = process.env.MPESA_ENVIRONMENT;
    const MPESA_BASE_URL =
      mpesaEnv === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    // Generate OAuth token
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const tokenResponse: AxiosResponse<{ access_token: string }> = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Format phone number
    const cleanedNumber = mpesa_number.replace(/\D/g, "");
    const formattedPhone = cleanedNumber.startsWith("254")
      ? cleanedNumber
      : `254${cleanedNumber.slice(-9)}`;

    // Timestamp & password
    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    // Save temporary session
    let session;
    if (purpose === "order") {
      session = await CheckoutSession.create({
        orderId: _id,
        phone: formattedPhone,
        amount,
        cart,
        status: "PENDING",
      });
    } else {
      session = await SubscriptionPayment.create({
        userId: _id,
        phone: formattedPhone,
        amount,
        planType: amount === 500 ? "WEEKLY" : "MONTHLY",
        status: "PENDING",
      });
    }

    // Send STK Push
    const stkResponse: AxiosResponse<any> = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `${purpose}-${_id}`,
        TransactionDesc:
          purpose === "subscription"
            ? "Subscription Payment"
            : "Order Payment",
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Save CheckoutRequestID
    if (purpose === "order") {
      await CheckoutSession.findByIdAndUpdate(session._id, {
        checkoutRequestID: stkResponse.data.CheckoutRequestID,
      });
    } else {
      await SubscriptionPayment.findByIdAndUpdate(session._id, {
        checkoutRequestID: stkResponse.data.CheckoutRequestID,
      });
    }

    console.log(`✅ STK Push Sent (${purpose}):`, stkResponse.data);

    return NextResponse.json({
      success: true,
      data: stkResponse.data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ STK Push Error:", message);
    return NextResponse.json(
      { success: false, message: "STK Push request failed", details: message },
      { status: 500 }
    );
  }
}











