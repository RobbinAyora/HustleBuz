import mongoose, { Schema, models } from "mongoose";

const ShopCartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        price: Number,
        image: String,
        quantity: { type: Number, default: 1 },
        vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true }, // ✅ important
      },
    ],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ShopCart = models.ShopCart || mongoose.model("ShopCart", ShopCartSchema);
export default ShopCart;




