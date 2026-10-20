import mongoose from "mongoose";
import { escapeRegex } from "./escapeRegex.js";
import { httpError } from "./httpError.js";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const SORT_VALUES = new Set([
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "rating",
  "discount",
]);

const invalid = (message) => {
  throw httpError(message, 400);
};

const asSingle = (value) => (Array.isArray(value) ? value[0] : value);

/** Normalize a brand for display and case-insensitive matching. */
export const normalizeBrand = (value) => {
  if (typeof value !== "string") invalid("Brand must be a string");
  const display = value.trim().replace(/\s+/g, " ");
  if (!display) invalid("Brand cannot be empty");
  return { display, normalized: display.toLowerCase() };
};

const parseNumber = (value, label, { max } = {}) => {
  if (value === undefined || value === null || value === "") return null;
  const raw = asSingle(value);
  if (typeof raw !== "string" && typeof raw !== "number") invalid(`Invalid ${label}`);
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0 || (max !== undefined && number > max)) {
    invalid(`Invalid ${label}`);
  }
  return number;
};

const parseBoolean = (value, label, defaultValue) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  const raw = asSingle(value);
  if (raw === true || raw === "true") return true;
  if (raw === false || raw === "false") return false;
  invalid(`Invalid ${label}`);
};

const parseBrands = (value) => {
  if (value === undefined || value === null || value === "") return [];
  const values = Array.isArray(value) ? value : [value];
  const normalized = [];
  for (const item of values) {
    if (typeof item !== "string") invalid("Invalid brand");
    for (const part of item.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      normalized.push(normalizeBrand(trimmed).normalized);
    }
  }
  return [...new Set(normalized)];
};

export const parseProductFilters = (query = {}) => {
  const searchValue = asSingle(query.search);
  if (searchValue !== undefined && typeof searchValue !== "string") invalid("Invalid search");

  const categoryValue = asSingle(query.categoryId ?? query.category);
  if (categoryValue !== undefined && categoryValue !== "" &&
      (!mongoose.Types.ObjectId.isValid(categoryValue) || String(categoryValue).length !== 24)) {
    invalid("Invalid category ID");
  }

  const minPrice = parseNumber(query.minPrice, "minimum price");
  const maxPrice = parseNumber(query.maxPrice, "maximum price");
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    invalid("Minimum price cannot be greater than maximum price");
  }

  const pageRaw = query.page === undefined || query.page === "" ? 1 : asSingle(query.page);
  const limitRaw = query.limit === undefined || query.limit === "" ? DEFAULT_LIMIT : asSingle(query.limit);
  if (!/^\d+$/.test(String(pageRaw)) || Number(pageRaw) < 1) invalid("Invalid page");
  if (!/^\d+$/.test(String(limitRaw)) || Number(limitRaw) < 1 || Number(limitRaw) > MAX_LIMIT) {
    invalid("Invalid limit");
  }

  const sort = query.sort === undefined || query.sort === "" ? "newest" : asSingle(query.sort);
  if (!SORT_VALUES.has(sort)) invalid("Invalid sort");

  return {
    search: (searchValue ?? "").trim(),
    brands: parseBrands(query.brands ?? query.brand),
    categoryId: categoryValue || null,
    minPrice,
    maxPrice,
    minRating: parseNumber(query.minRating, "minimum rating", { max: 5 }),
    inStock: parseBoolean(query.inStock, "inStock", false),
    onSale: parseBoolean(query.onSale, "onSale", false),
    sort,
    page: Number(pageRaw),
    limit: Number(limitRaw),
    includeTotal: parseBoolean(query.includeTotal, "includeTotal", true),
  };
};

export const buildProductFilterQuery = (filters = {}, { categoryIds } = {}) => {
  const query = { isPublished: true };
  if (filters.search) {
    const regex = { $regex: escapeRegex(filters.search), $options: "i" };
    query.$or = [
      { title: regex },
      { brand: regex },
      { brandNormalized: regex },
    ];
  }
  if (filters.brands?.length) query.brandNormalized = { $in: filters.brands };
  if (filters.categoryId) {
    query.category = {
      $in: categoryIds === undefined ? [filters.categoryId] : categoryIds,
    };
  }
  if (filters.minPrice !== null && filters.minPrice !== undefined ||
      filters.maxPrice !== null && filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== null && filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }
  if (filters.minRating !== null && filters.minRating !== undefined) {
    query["ratings.average"] = { $gte: filters.minRating };
  }
  if (filters.onSale) query.discountPercentage = { $gt: 0 };
  if (filters.inStock) {
    query.$and = [{ $or: [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }] }];
  }
  return query;
};

export const buildProductSort = (sort = "newest") => {
  switch (sort) {
    case "oldest": return { createdAt: 1 };
    case "price_asc": return { price: 1 };
    case "price_desc": return { price: -1 };
    case "rating": return { "ratings.average": -1, "ratings.count": -1 };
    case "discount": return { discountPercentage: -1 };
    case "newest": return { createdAt: -1 };
    default: invalid("Invalid sort");
  }
};
