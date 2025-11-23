"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  X,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Tags,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Product {
  _id?: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  description: string;
  categories: string[];
}

const CATEGORY_OPTIONS = [
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
];

export default function Product() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // ✅ Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(
          data.map((p: Product) => ({
            ...p,
            description: p.description ?? "",
            categories: p.categories ?? [],
          }))
        );
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock("");
    setImages([]);
    setDescription("");
    setCategories([]);
    setEditingProduct(null);
  };

  const handleAddOrUpdateProduct = async () => {
    if (!name.trim() || price.trim() === "" || stock.trim() === "") {
      return toast.error("Fill in all required fields");
    }

    const newProduct = {
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      images,
      description: description || "",
      categories,
    };

    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProduct),
        });
        if (!res.ok) throw new Error("Failed to update product");
        const updated = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p._id === updated._id ? { ...updated } : p))
        );

        toast.success("✏️ Product updated successfully");

        setTimeout(() => {
          resetForm();
          setShowForm(false);
        }, 500);
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProduct),
        });
        if (!res.ok) throw new Error("Failed to add product");
        const created = await res.json();
        setProducts((prev) => [{ ...created }, ...prev]);

        toast.success("✅ Product added successfully");

        setTimeout(() => {
          resetForm();
          setShowForm(false);
        }, 500);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Failed to save product");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setImages(product.images);
    setDescription(product.description ?? "");
    setCategories(product.categories ?? []);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id?: string) => {
    if (!id) return;

    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("🗑️ Product deleted successfully");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" /> Products
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <p className="text-gray-500 text-center mt-6">
          No products added yet. Click <strong>Add Product</strong> to create
          one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              key={product._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between transition"
            >
              {product.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mb-4">
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Product ${product.name}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  {product.name}
                </h3>
                <p className="text-gray-500 mt-1">
                  Price: Ksh.{product.price.toFixed(2)}
                </p>
                <p className="text-gray-500">Stock: {product.stock}</p>
                {product.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.categories.map((cat, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-md"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  {(product.description ?? "").length > 0
                    ? product.description.length > 50
                      ? product.description.slice(0, 50) + "..."
                      : product.description
                    : "No description available"}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex items-center gap-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product._id)}
                  className="flex items-center gap-1 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <textarea
                  placeholder="Product Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[80px]"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />

                {/* ✅ Multi-select Categories with label for accessibility */}
                <div>
                  <label
                    htmlFor="categories-select"
                    className="flex items-center gap-2 mb-2 font-medium text-gray-700"
                  >
                    <Tags className="w-5 h-5 text-gray-500" /> Categories
                  </label>
                  <select
                    id="categories-select"
                    multiple
                    value={categories}
                    onChange={(e) =>
                      setCategories(
                        Array.from(e.target.selectedOptions, (opt) => opt.value)
                      )
                    }
                    className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline">
                  <ImageIcon className="w-5 h-5" />
                  <span>Upload Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAddOrUpdateProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-xl transition font-semibold"
                >
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}











