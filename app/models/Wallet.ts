import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    mpesa_number: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    date: { type: Date, default: Date.now },
    transactionId: { type: String },
  },
  { _id: false }
);

const WalletSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    withdrawals: [WithdrawalSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);


