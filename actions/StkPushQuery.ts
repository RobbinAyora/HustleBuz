'use server';

import axios from 'axios';
import { connectDB } from '@/app/lib/db';
import SubscriptionPayment from '@/app/models/SubscriptionPayment';

interface StkQueryResult {
  status: 'PAID' | 'FAILED' | 'PENDING';
  startDate?: Date;
  endDate?: Date;
  resultDesc?: string;
}

export async function confirmStkPayment(
  subscriptionId?: string,       // optional
  checkoutRequestID?: string     // required
): Promise<StkQueryResult> {
  if (!checkoutRequestID) throw new Error('checkoutRequestID is required');

  await connectDB();

  const mpesaEnv = process.env.MPESA_ENVIRONMENT;
  const MPESA_BASE_URL =
    mpesaEnv === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

  // Generate access token
  const tokenRes = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64')}`,
      },
    }
  );
  const accessToken = tokenRes.data.access_token;

  // Timestamp & password for STK Query
  const date = new Date();
  const timestamp =
    date.getFullYear().toString() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  // -------------------------------------------------------
  // ✅ FIX APPLIED HERE
  // Ensure M-Pesa receives the correct field exactly:
  // "CheckoutRequestID"
  // -------------------------------------------------------
  const normalizedCheckoutID = checkoutRequestID.trim();
  // -------------------------------------------------------

  // Make STK Query request
  const queryRes = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,

      // MUST be exact case-sensitive key:
      CheckoutRequestID: normalizedCheckoutID,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const result = queryRes.data;

  // Subscription payment flow
  if (subscriptionId) {
    if (result.ResultCode === '0') {
      const payment = await SubscriptionPayment.findById(subscriptionId);
      if (!payment) throw new Error('Subscription not found');

      const startDate = new Date();
      const endDate = new Date(startDate);

      if (payment.plan === 'weekly') endDate.setDate(startDate.getDate() + 7);
      else if (payment.plan === 'monthly') endDate.setMonth(startDate.getMonth() + 1);
      else endDate.setDate(startDate.getDate() + 30);

      await SubscriptionPayment.findByIdAndUpdate(subscriptionId, {
        status: 'PAID',
        startDate,
        endDate,
        updatedAt: new Date(),
      });

      return { status: 'PAID', startDate, endDate };
    }

    if (['1032', '1'].includes(result.ResultCode?.toString())) {
      await SubscriptionPayment.findByIdAndUpdate(subscriptionId, { status: 'FAILED' });
      return { status: 'FAILED' };
    }

    return { status: 'PENDING', resultDesc: result.ResultDesc };
  }

  // Normal goods payment
  if (result.ResultCode === '0') return { status: 'PAID' };
  if (['1032', '1'].includes(result.ResultCode?.toString())) return { status: 'FAILED' };
  return { status: 'PENDING', resultDesc: result.ResultDesc };
}



