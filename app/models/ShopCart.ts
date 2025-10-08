import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface IShopCart extends Document {
  userId: mongoose.Types.ObjectId; // Buyer
  shopId: mongoose.Types.ObjectId; // The shop the cart belongs to
  items: ICartItem[];
  totalPrice: number;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: Schema.Types.ObjectId, ref: "MarketplaceProduct", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  quantity: { type: Number, default: 1 },
});

const shopCartSchema = new Schema<IShopCart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ShopCart: Model<IShopCart> =
  mongoose.models.ShopCart || mongoose.model("ShopCart", shopCartSchema);

export default ShopCart;
