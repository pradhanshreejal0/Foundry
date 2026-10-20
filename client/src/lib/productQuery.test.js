import test from "node:test";
import assert from "node:assert/strict";
import { mergeBrandOptions, parseProductQuery, serializeProductQuery } from "./productQuery.js";

test("migrates q and round-trips multi-brand filters", () => {
  const parsed = parseProductQuery("q=lamp&brand=Acme&brand=North%20Star&page=3");
  assert.equal(parsed.search, "lamp");
  assert.deepEqual(parsed.brand, ["Acme", "North Star"]);
  assert.equal(parsed.page, 3);
  const serialized = serializeProductQuery(parsed);
  assert.equal(serialized.get("search"), "lamp");
  assert.deepEqual(serialized.getAll("brand"), ["Acme", "North Star"]);
  assert.equal(serialized.get("q"), null);
});

test("omits defaults and normalizes unsupported sort", () => {
  const params = serializeProductQuery({ search: "", sort: "featured", page: 1, limit: 24 });
  assert.equal(params.toString(), "");
  assert.equal(parseProductQuery("sort=featured").sort, "newest");
});

test("retains selected brands before discovered options, stably deduplicated", () => {
  assert.deepEqual(
    mergeBrandOptions(["North Star", "Acme"], ["Acme", "Cedar", "North Star", "Cedar"]),
    ["North Star", "Acme", "Cedar"],
  );
});

test("boolean filters and canonical values serialize", () => {
  const params = serializeProductQuery({ search: "chair", inStock: true, onSale: true, minRating: "4", page: 1 });
  assert.equal(params.get("search"), "chair");
  assert.equal(params.get("inStock"), "true");
  assert.equal(params.get("onSale"), "true");
  assert.equal(params.get("minRating"), "4");
});
