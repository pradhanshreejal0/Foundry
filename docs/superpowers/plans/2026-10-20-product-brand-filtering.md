# Product Brand and Advanced Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vendor-managed product brands and a validated, server-side core-commerce filter contract with accurate customer search, totals, and pagination.

**Architecture:** Keep the existing Express/Mongoose product endpoint as the single source of truth. Add small pure query/normalization helpers so request parsing and filter behavior can be tested without a live MongoDB, then adapt the product controller and existing React pages to the canonical URL contract. Preserve legacy products without brands and existing compact/API callers.

**Tech Stack:** Node.js 20+, Express 4, Mongoose 9, Node built-in test runner, React 19, React Router 7, Vite, existing Tailwind/Lucide UI.

**Spec:** `docs/superpowers/specs/2026-10-20-product-brand-filtering-design.md`

## Global Constraints

- New products require a non-empty brand; existing documents without a brand remain readable and editable.
- `brand` preserves display casing; `brandNormalized` stores trimmed lower-case text for matching.
- Partial, case-insensitive matching is required for product title and brand search.
- Core filters are brand, category/subcategory, price range, minimum rating, in-stock, on-sale, and sort.
- Supported sort values are exactly `newest`, `oldest`, `price_asc`, `price_desc`, `rating`, and `discount`.
- Invalid IDs and filter values return clear `400` responses instead of database cast errors.
- Filter state is shareable through canonical URL parameters using `search`.
- No Atlas Search, Elasticsearch, or separate search service is introduced.
- Do not change authentication, vendor ownership, payment, or checkout behavior.
- Use Node >=20 and the repository's existing dependencies; do not add a test framework for this feature.

## Review Focus

- Legacy product documents with no brand must remain readable and editable; test a missing-brand response and update path in Task 2.
- A partial search such as `sam` must match `Samsung` regardless of case; test title and brand matching in Task 1.
- Malformed category IDs and invalid booleans/numbers/sorts must produce a 400 rather than a Mongoose CastError; test parser/controller behavior in Task 1 and Task 2.
- `onSale` and `inStock` must be applied before pagination so totals never describe only the first fetched page; test query predicates and metadata in Task 2.
- Rapid filter changes and browser back/forward must not leave stale results or a stale page number; test URL serialization/state behavior in Task 4.

---

### Task 1: Add product brand fields and pure filter-contract helpers

**Files:**
- Create: `server/utils/productFilters.js`
- Create: `server/utils/productFilters.test.js`
- Modify: `server/models/Product.js` (product field declarations and discovery indexes)

**Interfaces:**
- Produces `normalizeBrand(value) -> { display: string, normalized: string }`, throwing a validation error for an empty new-product brand.
- Produces `parseProductFilters(query) -> { search, brands, categoryId, minPrice, maxPrice, minRating, inStock, onSale, sort, page, limit, includeTotal }`, throwing an error carrying HTTP status 400 for invalid values.
- Produces `buildProductFilterQuery(filters, { categoryIds } = {}) -> MongoDB filter object`; title/brand search is case-insensitive partial matching, brands match `brandNormalized`, `onSale` checks positive discount, and `inStock` accounts for base stock or any variant stock.
- Produces `buildProductSort(sort) -> MongoDB sort object` for the six exact sort values.
- Product documents expose optional `brand` and `brandNormalized` fields; legacy documents may omit both.

- [ ] **Step 1: Write failing unit tests for brand normalization and filter parsing**
  - Assert `normalizeBrand("  Samsung  ")` returns display `Samsung` and normalized `samsung`.
  - Assert whitespace-only new brand input is rejected.
  - Assert parsing accepts comma-separated brands, finite nonnegative prices, `minRating` from 0 through 5, booleans, the six sort values, and positive page/limit values.
  - Assert malformed category IDs, nonnumeric/negative prices, `minPrice > maxPrice`, out-of-range ratings, invalid booleans, unsupported sorts, and invalid pagination throw status-400 errors.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test server/utils/productFilters.test.js`
Expected: FAIL because the helper module and its exports do not yet exist.

- [ ] **Step 3: Implement the helper module and model fields/indexes**
  - Normalize display text by trimming and collapsing repeated whitespace; normalize with locale-independent lower casing.
  - Parse repeated/comma-separated brand values into unique normalized values and cap/validate pagination using the endpoint's existing default limit of 24.
  - Build `$or` partial regex predicates for title, `brand`, and `brandNormalized`; escape user-provided regex characters.
  - Build stock predicates that match `stock > 0` or at least one `variants.stock > 0`.
  - Add optional schema fields with string trimming and a practical max length; do not make the schema field required so legacy documents continue to save. Add indexes for normalized brand and published discovery combinations without removing existing indexes.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test server/utils/productFilters.test.js`
Expected: PASS.

- [ ] **Step 5: Commit the self-contained data-contract change**

```bash
git add server/models/Product.js server/utils/productFilters.js server/utils/productFilters.test.js
git commit -m "feat: add product brand filter contract"
```

### Task 2: Move product filtering, pagination, and totals into the API

**Files:**
- Modify: `server/controllers/productController.js` (`getProducts`, create/update validation and persistence)
- Modify: `server/routes/productRoutes.js` only if route-level response behavior needs an explicit compatibility adjustment
- Create or modify: `server/controllers/productController.test.js` if the repository's controller testing pattern permits isolated mocks

**Interfaces:**
- Consumes the helpers from Task 1.
- `GET /api/products` accepts the canonical parameters and returns `{ products, pagination }`; preserve the existing compact projection and legacy response fields used by current callers.
- Product create/update persists `brand` and `brandNormalized`; create rejects missing/blank brand, while update may preserve an omitted brand on a legacy product.

- [ ] **Step 1: Add failing controller/query tests for the endpoint contract**
  - Verify a partial title/brand query, multiple brands, category descendants, price, minimum rating, stock, and sale predicates are combined before `skip/limit`.
  - Verify each supported sort maps correctly and pagination returns `page`, `limit`, `total`, and `pages`, including zero-result pages.
  - Verify invalid category IDs and filter values return status 400 with actionable messages.
  - Verify a create payload stores display and normalized brand, a blank new brand is rejected, and a legacy update without a brand does not erase/fail the existing missing field.

- [ ] **Step 2: Run the focused server tests and verify failure**

Run: `node --test server/controllers/productController.test.js server/utils/productFilters.test.js`
Expected: Newly added endpoint assertions fail against the current controller because it lacks the canonical filters, brand persistence, or accurate metadata.

- [ ] **Step 3: Integrate validated filters into `getProducts`**
  - Parse query parameters before any Mongoose lookup.
  - Validate `category` with `mongoose.isValidObjectId` before querying; resolve the selected category and its direct children.
  - Apply all predicates to the Mongo query before pagination. Use a case-insensitive partial regex search for title/brand and normalized equality for selected brands.
  - Compute total only when requested (or as required by the shop client), calculate `pages = Math.ceil(total / limit)`, and return the established product shape plus pagination metadata.
  - Remove the unsupported `featured` sort behavior from the API contract; map no unknown sort silently to a different ordering.

- [ ] **Step 4: Integrate brand validation/persistence into vendor create/update**
  - On create, call `normalizeBrand` and reject blank input with the existing validation response style.
  - On update, normalize when supplied and leave an omitted legacy brand untouched; never allow a failed normalization to partially save the product.
  - Keep all existing ownership, category, image, variant, discount, and publish validations unchanged.

- [ ] **Step 5: Run focused tests and server syntax checks**

Run: `node --test server/utils/productFilters.test.js server/controllers/productController.test.js && npm --prefix server test`
Expected: PASS with no syntax errors. If controller tests require unavailable database infrastructure, keep pure helper coverage and run the available syntax/test subset while documenting the limitation.

- [ ] **Step 6: Commit the API implementation**

```bash
git add server/controllers/productController.js server/routes/productRoutes.js server/controllers/productController.test.js
git commit -m "feat: add server-side product filtering"
```

### Task 3: Add brand entry to the vendor product workflow

**Files:**
- Modify: `client/src/pages/vendor/Products.jsx`
- Modify: `client/src/pages/vendor/Products.jsx` tests if a colocated test convention is introduced; otherwise rely on build/lint and API tests from Task 2

**Interfaces:**
- Consumes the create/update API contract from Task 2.
- Vendor form submits `brand` for both POST and PUT, displays server validation errors using existing form error handling, and preserves brand when editing.

- [ ] **Step 1: Inspect the existing form state and add a failing/behavioral test seam if practical**
  - Pin the expected initial brand state, edit hydration, and payload field in the smallest existing testable helper or component test; do not introduce a new framework solely for this page.

- [ ] **Step 2: Add the brand field to create/edit state and reset logic**
  - Initialize brand to an empty string for new products.
  - Populate it from the product when entering edit mode, including undefined legacy products as an empty input.
  - Clear it when the form resets after successful creation or cancellation.

- [ ] **Step 3: Render and validate the Brand input**
  - Place a labeled text input near the title/category fields, with a concise placeholder and accessible label.
  - Require non-whitespace content client-side and show the existing inline validation style before submission.

- [ ] **Step 4: Include brand in POST/PUT payloads and verify the UI build**
  - Send the raw display value; let the server own normalization.
  - Confirm edit, duplicate-submit locking, image uploads, variants, and existing fields remain unchanged.

Run: `npm --prefix client run lint && npm --prefix client run build`
Expected: PASS.

- [ ] **Step 5: Commit the vendor workflow change**

```bash
git add client/src/pages/vendor/Products.jsx
git commit -m "feat: let vendors add product brands"
```

### Task 4: Replace client-side filtering with canonical shop filters and pagination

**Files:**
- Modify: `client/src/pages/customer/Shop.jsx`
- Modify: `client/src/pages/customer/Home.jsx` (search/filter links and unsupported `featured` link)
- Modify: `client/src/lib/api.js` only if response/query serialization needs a shared helper
- Create: `client/src/lib/productQuery.js` and `client/src/lib/productQuery.test.js` if extracting pure URL parsing/serialization keeps `Shop.jsx` maintainable

**Interfaces:**
- Consumes `GET /api/products` response and query contract from Task 2.
- Produces canonical URL parameters: `search`, `brand`, `category`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `onSale`, `sort`, `page`, and `limit`.
- The shop renders server-provided products, total/pages, and loading/error/empty states without a second local on-sale filter.

- [ ] **Step 1: Add failing tests for canonical URL serialization/parsing if the helper is extracted**
  - Assert `q` is migrated/read as `search` for compatibility, serialization omits empty/default values, multi-brand values round-trip, and changing any filter resets `page` to 1.
  - Assert unsupported `featured` is converted to the default supported sort rather than sent to the API.

- [ ] **Step 2: Implement the URL/query helper or equivalent local functions**
  - Keep filter state derived from `useSearchParams` so reload, share links, and browser navigation restore the same controls.
  - Debounce free-text input before updating the URL/request; avoid stale responses overwriting newer filter state.

- [ ] **Step 3: Add the core filter controls**
  - Add brand selection (single or multi-select from server/current discovery options), category/subcategory, min/max price, minimum rating, in-stock, on-sale, and supported sort controls.
  - Preserve existing visual conventions and responsive layout.
  - Reset page when a control changes and provide a clear-all action that preserves only intentional defaults.

- [ ] **Step 4: Request and render server-side results**
  - Send `search` consistently, include all active filters, request totals, and use server pagination metadata.
  - Remove the local sale-only post-filter and any assumptions that the fetched array is the complete result set.
  - Render accurate result counts and pagination controls; handle empty pages by moving to the last valid page when metadata shows the requested page is out of range.

- [ ] **Step 5: Update Home/search links and verify client checks**
  - Change direct `q`/`search` inconsistencies to canonical `search` links while retaining compatibility for existing shared URLs.
  - Replace or remove the unsupported `sort=featured` link.

Run: `npm --prefix client run lint && npm --prefix client run build`
Expected: PASS.

- [ ] **Step 6: Commit the customer discovery UI**

```bash
git add client/src/pages/customer/Shop.jsx client/src/pages/customer/Home.jsx client/src/lib/productQuery.js client/src/lib/productQuery.test.js
git commit -m "feat: add advanced product discovery filters"
```

### Task 5: Full verification and integration review

**Files:**
- Modify only if verification finds a defect in Tasks 1–4.

- [ ] **Step 1: Run all available focused tests and syntax checks**

Run from the repository root:

```bash
node --test server/utils/productFilters.test.js server/utils/productRanking.test.js
npm --prefix server test
npm --prefix client run lint
npm --prefix client run build
```

Expected: all commands pass. The root `npm test` remains the repository's placeholder and is not used as the feature gate.

- [ ] **Step 2: Review the final diff against the specification**
  - Confirm no client-only sale filtering remains.
  - Confirm all new filters are applied before pagination and all URL/API names agree.
  - Confirm legacy products and vendor ownership behavior remain compatible.
  - Confirm no secrets, generated artifacts, or unrelated refactors are included.

- [ ] **Step 3: Commit only any verification fixes**

```bash
git add <verified-fix-files>
git commit -m "fix: verify product filtering integration"
```
