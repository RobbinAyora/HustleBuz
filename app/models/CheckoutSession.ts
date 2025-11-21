import mongoose, { Schema, models } from "mongoose";

const CheckoutSessionSchema = new Schema(
  {
    orderId: String,
    phone: String,
    amount: Number,
    cart: {
      items: [
        {
          productId: { type: Schema.Types.ObjectId, ref: "Product" },
          name: String,
          quantity: Number,
          price: Number,
          vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
        },
      ],
    },
    status: { type: String, default: "PENDING" },
    checkoutRequestID: String,
  },
  { timestamps: true }
);

const CheckoutSession =
  models.CheckoutSession || mongoose.model("CheckoutSession", CheckoutSessionSchema);

export default CheckoutSession;
