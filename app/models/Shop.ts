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
  owner: mongoose.Types.ObjectId;
  description?: string;   // ✅ Add this
}

const shopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true },
    logo: { type: String },

    description: { type: String, default: "" },  // ✅ Add this

    theme: {
      primaryColor: { type: String, default: "#1D4ED8" },
      secondaryColor: { type: String, default: "#FFFFFF" },
      accentColor: { type: String, default: "#FBBF24" },
      layout: {
        type: String,
        enum: ["classic", "modern", "minimal"],
        default: "classic",
      },
    },
    link: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Each owner can only have one shop per link
shopSchema.index({ owner: 1, link: 1 }, { unique: true });

const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>("Shop", shopSchema);

export default Shop;













