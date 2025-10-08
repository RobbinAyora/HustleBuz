"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Tags } from "lucide-react";
import { Star, StarHalf } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Review {
  _id: string;
  user: string;
  rating: number;
  comment: string;
}

interface Vendor {
  _id: string;
  name: string;
  logo?: string;
  link: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
  categories: string[];
  rating?: number;
  reviews?: Review[];
  vendor?: Vendor;
}

export default function ProductPage() {
  const params = useParams();
  const productId = params.id;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      setCart((prev) => [...prev, product]);
      toast.success(`${product.name} added to cart`);
    }
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewComment.trim()) {
      toast.error("Please provide rating and comment");
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await fetch(`/api/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      const newReview = await res.json();

      setProduct((prev) => prev && {
        ...prev,
        reviews: prev.reviews ? [...prev.reviews, newReview] : [newReview],
        rating: prev.reviews
          ? (prev.reviews.reduce((sum, r) => sum + r.rating, 0) + reviewRating) /
            (prev.reviews.length + 1)
          : reviewRating,
      });

      setReviewComment("");
      setReviewRating(0);
      toast.success("Review submitted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const StarRating = ({
    rating,
    setRating,
  }: {
    rating: number;
    setRating?: (r: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rating;
        const half = i - 0.5 === rating;

        return (
          <span key={i} className="cursor-pointer" onClick={() => setRating && setRating(i)}>
            {filled ? (
              <Star className="w-6 h-6 text-yellow-500" />
            ) : half ? (
              <StarHalf className="w-6 h-6 text-yellow-500" />
            ) : (
              <Star className="w-6 h-6 text-gray-300" />
            )}
          </span>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Vendor Info */}
        {product.vendor && (
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center gap-4">
              {product.vendor.logo ? (
                <img
                  src={product.vendor.logo}
                  alt={product.vendor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <Package className="w-16 h-16 text-gray-400" />
              )}
              <div>
                <h2 className="text-xl font-bold">{product.vendor.name}</h2>
              </div>
            </div>
            <button
              onClick={() => router.push(`/shop/${product.vendor.link}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-semibold transition"
            >
              Go to Shop
            </button>
          </div>
        )}

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div className="flex flex-col gap-4">
            {product.images.length > 0 ? (
              product.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={product.name}
                  className="w-full h-80 object-cover rounded-xl border"
                />
              ))
            ) : (
              <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded-lg border">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-gray-500">{product.description}</p>
            <p className="text-blue-600 font-bold text-2xl">Ksh.{product.price.toFixed(2)}</p>
            <p className="text-gray-500">Stock: {product.stock}</p>

            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {product.categories.map((cat, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-md flex items-center gap-1"
                  >
                    <Tags className="w-3 h-3" /> {cat}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition font-semibold w-full lg:w-1/2"
            >
              Add to Cart
            </button>

            {/* Rating */}
            {product.rating && (
              <div className="mt-4 flex items-center gap-2">
                <StarRating rating={Math.round(product.rating)} />
                <span className="text-gray-700 font-semibold">{product.rating.toFixed(1)} / 5</span>
              </div>
            )}

            {/* Review Form */}
            <div className="mt-6 bg-white p-4 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Write a Review</h2>
              <StarRating rating={reviewRating} setRating={setReviewRating} />
              <textarea
                className="w-full border rounded-md p-2 mt-2 resize-none"
                rows={3}
                placeholder="Write your review..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <button
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition font-semibold"
                onClick={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>

            {/* Reviews */}
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Reviews</h2>
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((review) => (
                  <div key={review._id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                    <p className="font-semibold">{review.user}</p>
                    <StarRating rating={review.rating} />
                    <p className="text-gray-600 mt-1">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



