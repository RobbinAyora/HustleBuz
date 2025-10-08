import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "buyer" | "vendor";
  subscriptionExpires: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "vendor"], default: "buyer" },
    subscriptionExpires: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 1 month trial
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
