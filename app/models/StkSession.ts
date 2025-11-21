import mongoose, { Schema, Document } from "mongoose";

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

// ✅ Always delete cached model before redefining
delete mongoose.connection.models["StkSession"];

const StkSession =
  mongoose.models.StkSession ||
  mongoose.model<IStkSession>("StkSession", StkSessionSchema, "stk_sessions");

export default StkSession;

