'use server';

import axios from 'axios';

interface Params {
  _id: string; // user id or order id
  mpesa_number: string;
  amount: number;
  purpose?: 'order' | 'subscription'; // ✅ added
}

export const sendStkPush = async (body: Params) => {
  try {
    const { mpesa_number: phoneNumber, amount, _id, purpose = 'order' } = body;

    const mpesaEnv = process.env.MPESA_ENVIRONMENT;
    const MPESA_BASE_URL =
      mpesaEnv === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // ✅ Format phone number (Kenya only)
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    const formattedPhone =
      cleanedNumber.startsWith('254') || cleanedNumber.startsWith('07')
        ? `254${cleanedNumber.slice(-9)}`
        : `254${cleanedNumber.slice(-9)}`;

    // ✅ Timestamp & password
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

    // ✅ Send STK Push
    const stkResponse = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `${purpose}-${_id}`, // ✅ differentiate payments
        TransactionDesc:
          purpose === 'subscription'
            ? 'Subscription Payment'
            : 'Order Payment',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log('✅ STK Push Sent:', stkResponse.data);
    return { success: true, data: stkResponse.data };
  } catch (error: any) {
    console.error('❌ STK Push Error:', error?.response?.data || error.message);
    return { success: false, error: 'STK Push request failed' };
  }
};
