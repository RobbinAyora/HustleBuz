export async function vendorOrders() {
  try {
    const res = await fetch("/api/orders/vendor", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ ensures cookies (token) are sent
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch vendor orders");
    }

    return data.data; // { vendor, stats, orders }
  } catch (error: any) {
    console.error("❌ vendorOrders fetch error:", error);
    throw new Error(error.message);
  }
}
