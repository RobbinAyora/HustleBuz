// app/models/Shop.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  layout: "classic" | "modern" | "minimal";
}

export interface IShop extends Document {
  name: string;
  contact: string;
  logo?: string;
  theme: ITheme;
  link: string;
  owner: mongoose.Types.ObjectId; // ✅ vendor = User
}

const shopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    logo: String,
    theme: {
      primaryColor: { type: String, default: "#1D4ED8" }, // old themeColor
      secondaryColor: { type: String, default: "#FFFFFF" },
      accentColor: { type: String, default: "#FBBF24" },
      layout: { type: String, default: "classic" },
    },
    link: { type: String, required: true, unique: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export default Shop; 




