import mongoose, { Schema, Document } from "mongoose";

// ✅ Review interface
export interface IReview {
  user: string;
  userId?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

// ✅ Product interface
export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  vendor?: mongoose.Types.ObjectId;
  categories: string[];
  reviews?: IReview[]; // ✅ added reviews
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Review schema
const ReviewSchema: Schema = new Schema({
  user: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Product schema
const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price must be a positive number"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categories: {
      type: [String],
      default: [],
      enum: [
        "Electronics",
        "Fashion",
        "Home & Kitchen",
        "Beauty & Personal Care",
        "Sports & Outdoors",
        "Toys & Games",
        "Automotive",
        "Books",
        "Health",
        "Groceries",
        "Other",
      ],
    },
    reviews: {
      type: [ReviewSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ Export model with unique name to avoid conflicts
export default mongoose.models.MarketplaceProduct ||
  mongoose.model<IProduct>(
    "MarketplaceProduct",
    ProductSchema,
    "marketplace_products"
  );





