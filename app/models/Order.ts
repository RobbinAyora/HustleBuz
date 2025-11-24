import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    buyerPhone: { type: String, required: true },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MarketplaceProduct",   // ✅ FIXED HERE
          required: true
        },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],

    amount: { type: Number, required: true },

    status: { type: String, enum: ["paid"], default: "paid" },

    mpesaReceipt: { type: String },
    CheckoutRequestID: { type: String, index: true },
    paymentConfirmedAt: { type: Date },
  },
  { timestamps: true }
);

const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;













