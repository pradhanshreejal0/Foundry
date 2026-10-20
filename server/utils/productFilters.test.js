import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeBrand,
  parseProductFilters,
  buildProductFilterQuery,
  buildProductSort,
} from "./productFilters.js";

const invalid = (fn) => {
  assert.throws(fn, (error) => error?.statusCode === 400);
};

test("normalizeBrand trims, collapses whitespace, and lowercases predictably", () => {
  assert.deepEqual(normalizeBrand("  Samsung  "), {
    display: "Samsung",
    normalized: "samsung",
  });
  assert.deepEqual(normalizeBrand("  Apple   iPhone "), {
    display: "Apple iPhone",
    normalized: "apple iphone",
  });
  invalid(() => normalizeBrand(" \t "));
});

test("parseProductFilters accepts the complete filter contract", () => {
  assert.deepEqual(parseProductFilters({
    search: "  phone ",
    brand: "Samsung, Apple,samsung",
    categoryId: "507f1f77bcf86cd799439011",
    minPrice: "10",
    maxPrice: "99.5",
    minRating: "0",
    inStock: "true",
    onSale: "false",
    sort: "rating_desc",
    page: "2",
    limit: "24",
    includeTotal: "false",
  }), {
    search: "phone",
    brands: ["samsung", "apple"],
    categoryId: "507f1f77bcf86cd799439011",
    minPrice: 10,
    maxPrice: 99.5,
    minRating: 0,
    inStock: true,
    onSale: false,
    sort: "rating_desc",
    page: 2,
    limit: 24,
    includeTotal: false,
  });
});

test("parseProductFilters supplies safe defaults", () => {
  assert.deepEqual(parseProductFilters({}), {
    search: "",
    brands: [],
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    minRating: null,
    inStock: false,
    onSale: false,
    sort: "newest",
    page: 1,
    limit: 24,
    includeTotal: true,
  });
});

test("parseProductFilters rejects malformed values with HTTP 400 errors", () => {
  for (const query of [
    { categoryId: "not-an-object-id" },
    { minPrice: "nope" },
    { minPrice: "-1" },
    { maxPrice: "-1" },
    { minPrice: "20", maxPrice: "10" },
    { minRating: "-0.1" },
    { minRating: "5.1" },
    { minRating: "nope" },
    { inStock: "yes" },
    { onSale: "1" },
    { includeTotal: "sometimes" },
    { sort: "random" },
    { page: "0" },
    { page: "1.5" },
    { page: "nope" },
    { limit: "0" },
    { limit: "51" },
    { limit: "nope" },
  ]) invalid(() => parseProductFilters(query));
});

test("buildProductFilterQuery builds search, category, price, sale, rating, and stock filters", () => {
  const query = buildProductFilterQuery({
    search: "red+phone",
    brands: ["samsung", "apple"],
    categoryId: "507f1f77bcf86cd799439011",
    minPrice: 10,
    maxPrice: 99,
    minRating: 4,
    inStock: true,
    onSale: true,
  }, { categoryIds: ["cat1", "cat2"] });

  assert.deepEqual(query.isPublished, true);
  assert.deepEqual(query.brandNormalized, { $in: ["samsung", "apple"] });
  assert.deepEqual(query.category, { $in: ["cat1", "cat2"] });
  assert.deepEqual(query.price, { $gte: 10, $lte: 99 });
  assert.deepEqual(query["ratings.average"], { $gte: 4 });
  assert.deepEqual(query.discountPercentage, { $gt: 0 });
  assert.deepEqual(query.$or, [
    { title: { $regex: "red\\+phone", $options: "i" } },
    { brand: { $regex: "red\\+phone", $options: "i" } },
    { brandNormalized: { $regex: "red\\+phone", $options: "i" } },
  ]);
  assert.deepEqual(query.$and, [{ $or: [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }] }]);
});

test("buildProductSort supports all six sort values", () => {
  assert.deepEqual(buildProductSort("newest"), { createdAt: -1 });
  assert.deepEqual(buildProductSort("oldest"), { createdAt: 1 });
  assert.deepEqual(buildProductSort("price_asc"), { price: 1 });
  assert.deepEqual(buildProductSort("price_desc"), { price: -1 });
  assert.deepEqual(buildProductSort("rating_desc"), { "ratings.average": -1, "ratings.count": -1 });
  assert.deepEqual(buildProductSort("name_asc"), { title: 1 });
});
