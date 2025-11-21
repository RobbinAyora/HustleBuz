// app/models/Escrow.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IEscrow extends Document {
  order: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  amountHeld: number;
  released: boolean;
  releasedAt?: Date;
}

const EscrowSchema = new Schema<IEscrow>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountHeld: { type: Number, required: true },
    released: { type: Boolean, default: false },
    releasedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Escrow ||
  mongoose.model<IEscrow>("Escrow", EscrowSchema, "escrow");
