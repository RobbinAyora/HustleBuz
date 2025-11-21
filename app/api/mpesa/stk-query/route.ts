// app/api/mpesa/stk-query/route.ts

import { confirmStkPayment } from "@/actions/StkPushQuery";
import { NextResponse } from "next/server";

const POLL_INTERVAL_MS = 15000; // 15 seconds
const MAX_RETRIES = 5;

// 🔒 Prevent multiple simultaneous stk-query calls for the same CheckoutRequestID
const activeQueries = new Map<string, Promise<{ success: boolean; result: any }>>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔹 STK Query request body:", body);

    const subscriptionId: string | undefined = body.subscriptionId;
    const checkoutRequestID: string | undefined =
      body.checkoutRequestID || body.CheckoutRequestID;

    // Validate input
    if (!checkoutRequestID) {
      console.warn("⚠️ Missing required field: checkoutRequestID");
      return NextResponse.json(
        { success: false, message: "checkoutRequestID is required" },
        { status: 400 }
      );
    }

    console.log("ℹ️ Starting STK Query processing...");

    // 🔒 If a query for this CheckoutRequestID is already running, return the stored plain data
    if (activeQueries.has(checkoutRequestID)) {
      console.log("⏳ Returning existing in-progress STK Query result...");
      const existingData = await activeQueries.get(checkoutRequestID);
      return NextResponse.json(existingData);
    }

    // Wrap entire polling logic inside a promise that resolves to **plain data**
    const queryPromise = (async () => {
      let attempt = 0;
      let result;

      while (attempt < MAX_RETRIES) {
        attempt++;
        try {
          result = await confirmStkPayment(subscriptionId, checkoutRequestID);

          if (result.status === "PAID" || result.status === "FAILED") {
            break;
          }

          console.log(
            `⚠️ Payment still pending. Retrying in ${POLL_INTERVAL_MS / 1000}s (Attempt ${attempt})`
          );

          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        } catch (err: any) {
          console.warn(`⚠️ STK Query failed on attempt ${attempt}: ${err.message}`);
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
      }

      if (!result) {
        result = { status: "PENDING", resultDesc: "No response from M-Pesa" };
      }

      console.log("✅ STK Query result:", result);

      // 🔑 Return plain object, not NextResponse
      return { success: true, result };
    })();

    // Store running query (plain data promise)
    activeQueries.set(checkoutRequestID, queryPromise);

    // Wait for result
    const finalData = await queryPromise;

    // Remove from active queries after completion
    activeQueries.delete(checkoutRequestID);

    // Wrap in a fresh NextResponse
    return NextResponse.json(finalData);
  } catch (error: any) {
    console.error("❌ STK Query API Error:", error);
    if (error.response) {
      console.error("🔹 Response data:", error.response.data);
      console.error("🔹 Response status:", error.response.status);
      console.error("🔹 Response headers:", error.response.headers);
    }

    return NextResponse.json(
      {
        success: false,
        message: "Server error occurred while confirming STK payment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}









