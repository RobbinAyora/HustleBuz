import mongoose, { Schema, models } from "mongoose";

const itemSchema = new Schema({
  productId: { type: String, required: true },
  vendorId: { type: String, required: true }, // ✅ keep required for multi-vendor
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, default: 1 },
});

const cartSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [itemSchema],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Cart = models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;





