// app/api/mpesa/stk-query/route.ts

import { confirmStkPayment } from "@/actions/StkPushQuery";
import { NextResponse } from "next/server";

const POLL_INTERVAL_MS = 15000; // 15 seconds
const MAX_RETRIES = 5;

interface StkResult {
  status: "PAID" | "FAILED" | "PENDING";
  resultDesc?: string;
  [key: string]: any;
}

// 🔒 Prevent multiple simultaneous stk-query calls for the same CheckoutRequestID
const activeQueries = new Map<string, Promise<{ success: boolean; result: StkResult }>>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔹 STK Query request body:", body);

    const subscriptionId: string | undefined = body.subscriptionId;
    const checkoutRequestID: string | undefined =
      body.checkoutRequestID || body.CheckoutRequestID;

    if (!checkoutRequestID) {
      console.warn("⚠️ Missing required field: checkoutRequestID");
      return NextResponse.json(
        { success: false, message: "checkoutRequestID is required" },
        { status: 400 }
      );
    }

    console.log("ℹ️ Starting STK Query processing...");

    if (activeQueries.has(checkoutRequestID)) {
      console.log("⏳ Returning existing in-progress STK Query result...");
      const existingData = await activeQueries.get(checkoutRequestID);
      return NextResponse.json(existingData);
    }

    const queryPromise = (async (): Promise<{ success: boolean; result: StkResult }> => {
      let attempt = 0;
      let result: StkResult | undefined;

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
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.warn(`⚠️ STK Query failed on attempt ${attempt}: ${message}`);
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
      }

      if (!result) {
        result = { status: "PENDING", resultDesc: "No response from M-Pesa" };
      }

      console.log("✅ STK Query result:", result);

      return { success: true, result };
    })();

    activeQueries.set(checkoutRequestID, queryPromise);

    const finalData = await queryPromise;

    activeQueries.delete(checkoutRequestID);

    return NextResponse.json(finalData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ STK Query API Error:", message);

    return NextResponse.json(
      {
        success: false,
        message: "Server error occurred while confirming STK payment",
        details: message,
      },
      { status: 500 }
    );
  }
}










