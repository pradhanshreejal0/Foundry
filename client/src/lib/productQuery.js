export const DEFAULT_PRODUCT_QUERY = Object.freeze({
  search: "",
  brand: [],
  category: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  inStock: false,
  onSale: false,
  sort: "newest",
  page: 1,
  limit: 24,
});

export const SUPPORTED_PRODUCT_SORTS = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "rating",
  "discount",
];

const asBoolean = (value) => value === "1" || value === "true";
const cleanBrands = (values) => [...new Set(values.flatMap((value) => String(value).split(",")))]
  .map((value) => value.trim())
  .filter(Boolean);

export function parseProductQuery(input) {
  const params = input instanceof URLSearchParams ? input : new URLSearchParams(input);
  const sort = params.get("sort");
  const page = Number.parseInt(params.get("page") || "1", 10);
  const limit = Number.parseInt(params.get("limit") || String(DEFAULT_PRODUCT_QUERY.limit), 10);
  return {
    ...DEFAULT_PRODUCT_QUERY,
    search: (params.get("search") ?? params.get("q") ?? "").trim(),
    brand: cleanBrands(params.getAll("brand").concat(params.getAll("brands"))),
    category: params.get("category") || params.get("categoryId") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    minRating: params.get("minRating") || "",
    inStock: asBoolean(params.get("inStock")),
    onSale: asBoolean(params.get("onSale")),
    sort: SUPPORTED_PRODUCT_SORTS.includes(sort) ? sort : "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : DEFAULT_PRODUCT_QUERY.limit,
  };
}

export function serializeProductQuery(query = {}) {
  const state = { ...DEFAULT_PRODUCT_QUERY, ...query };
  const params = new URLSearchParams();
  const search = String(state.search || "").trim();
  if (search) params.set("search", search);
  cleanBrands(Array.isArray(state.brand) ? state.brand : [state.brand]).forEach((brand) => {
    params.append("brand", brand);
  });
  if (state.category) params.set("category", state.category);
  if (state.minPrice !== "" && state.minPrice != null) params.set("minPrice", state.minPrice);
  if (state.maxPrice !== "" && state.maxPrice != null) params.set("maxPrice", state.maxPrice);
  if (state.minRating !== "" && state.minRating != null) params.set("minRating", state.minRating);
  if (state.inStock) params.set("inStock", "1");
  if (state.onSale) params.set("onSale", "1");
  if (state.sort !== "newest" && SUPPORTED_PRODUCT_SORTS.includes(state.sort)) params.set("sort", state.sort);
  if (Number(state.page) > 1) params.set("page", String(state.page));
  if (Number(state.limit) !== DEFAULT_PRODUCT_QUERY.limit) params.set("limit", String(state.limit));
  return params;
}

export function productQueryString(query = {}) {
  return serializeProductQuery(query).toString();
}
