// app/models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "vendor" | "buyer";
  phoneNumber?: string;
  image?: string;
  subscription?: {
    plan: string;
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["vendor", "buyer"], default: "buyer" },
    phoneNumber: { type: String, default: "" },
    image: { type: String, default: "" },
    subscription: {
      plan: { type: String, default: "Free" },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);





