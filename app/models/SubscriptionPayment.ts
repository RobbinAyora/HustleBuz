import mongoose from "mongoose";

const SubscriptionPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  phone: {
    type: String,
  },
  amount: {
    type: Number,
    default: 0, // Free trial has no cost
  },
  plan: {
    type: String,
    enum: ["free_trial", "weekly", "monthly"],
    required: true,
    default: "free_trial",
  },
  checkoutRequestID: {
    type: String,
  },
  mpesaReceiptNumber: {
    type: String,
  },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "ACTIVE", "FAILED", "EXPIRED"],
    default: "PENDING",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Automatically set start/end dates when status changes
SubscriptionPaymentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date();

    // When activating free trial
    if (this.plan === "free_trial" && this.status === "ACTIVE") {
      this.startDate = now;
      const end = new Date();
      end.setDate(end.getDate() + 30); // 30-day trial
      this.endDate = end;
    }

    // When activating paid plan
    if (this.status === "PAID") {
      this.startDate = now;

      if (this.plan === "weekly") {
        const end = new Date();
        end.setDate(now.getDate() + 7);
        this.endDate = end;
      } else if (this.plan === "monthly") {
        const end = new Date();
        end.setMonth(now.getMonth() + 1);
        this.endDate = end;
      }
    }
  }

  next();
});

export default mongoose.models.SubscriptionPayment ||
  mongoose.model("SubscriptionPayment", SubscriptionPaymentSchema);

