// app/models/Payment.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  amount: number;
  mpesaReceiptNumber?: string;
  phoneNumber: string;
  status: "Pending" | "Completed" | "Failed";
  transactionDate?: Date;
  rawResponse?: Record<string, unknown>; // ✅ fixed type
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    mpesaReceiptNumber: { type: String },
    phoneNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    transactionDate: { type: Date },
    rawResponse: { type: Schema.Types.Mixed }, // keeps Mongo flexibility
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema, "payments");

