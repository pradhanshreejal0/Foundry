export const buildBestSellerPipeline = () => [
  { $match: { status: "delivered" } },
  { $unwind: "$items" },
  { $match: { "items.status": "delivered", "items.product": { $ne: null } } },
  { $group: { _id: "$items.product", unitsSold: { $sum: "$items.quantity" } } },
  { $sort: { unitsSold: -1 } },
];

/**
 * Sort products by their position in the sales ranking.
 * Products that do not appear in `sales` are placed at the end (stable among themselves).
 */
export const orderProductsBySales = (products, sales) => {
  const rank = new Map(sales.map((item, index) => [String(item._id), index]));
  return [...products].sort((a, b) => {
    const ra = rank.get(String(a._id));
    const rb = rank.get(String(b._id));
    if (ra == null && rb == null) return 0;
    if (ra == null) return 1;
    if (rb == null) return -1;
    return ra - rb;
  });
};
