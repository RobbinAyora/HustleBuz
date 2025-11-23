import mongoose, { Schema, Document, Model } from "mongoose";

interface IStkSession extends Document {
  checkoutRequestID: string;
  merchantRequestID: string;
  phoneNumber: string;
}

const StkSessionSchema = new Schema<IStkSession>(
  {
    checkoutRequestID: { type: String, required: true },
    merchantRequestID: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Correct way: check if model exists, otherwise create it
const StkSession: Model<IStkSession> =
  mongoose.models.StkSession ||
  mongoose.model<IStkSession>("StkSession", StkSessionSchema, "stk_sessions");

export default StkSession;

