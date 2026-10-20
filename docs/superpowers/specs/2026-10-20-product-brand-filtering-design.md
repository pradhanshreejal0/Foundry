# Product Brand and Advanced Filtering Design

**Date:** 2026-10-20
**Status:** Approved conversational design; pending written-spec review

## Goal

Fix the current product-filtering inconsistencies and add a server-first product discovery contract. Vendors should be able to enter a product brand, and customers should be able to find products using accurate, shareable core commerce filters.

## Scope

### Product and vendor data

Add `brand` and `brandNormalized` fields to products:

- `brand` preserves the vendor's display casing.
- `brandNormalized` stores trimmed, lower-case text for matching.
- New products require a non-empty brand.
- Existing products without a brand remain readable and editable so the change is backward-compatible.
- Vendor create/edit forms expose a clear Brand input and submit it through the existing product API.
- Add indexes supporting published brand/category/discount discovery.

### Product API

Extend `GET /api/products` with the following query parameters:

- `search`: case-insensitive partial matching against product title and brand.
- `brand`: one brand or multiple comma-separated brands.
- `category`: selected category and its direct subcategories.
- `minPrice`, `maxPrice`: validated numeric range.
- `minRating`: minimum average rating.
- `inStock`: boolean; includes base-stock and variant-stock products with available inventory.
- `onSale`: boolean; requires a positive discount percentage.
- `sort`: `newest`, `oldest`, `price_asc`, `price_desc`, `rating`, or `discount`.
- `page`, `limit`, `includeTotal`: validated pagination controls.

Invalid IDs and filter values return clear `400` responses rather than database cast errors. The response includes accurate pagination metadata:

```json
{
  "products": [],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 0,
    "pages": 0
  }
}
```

Existing compact responses and old query parameters remain compatible where practical.

### Customer UI

Update the shop/product discovery UI to:

- Use `search` consistently in URL and API requests.
- Keep filter state in the URL for sharing and browser navigation.
- Provide brand, category/subcategory, price range, minimum rating, in-stock, on-sale, and sort controls.
- Debounce free-text search.
- Reset to page 1 when filters change.
- Remove client-only sale filtering and unsupported `featured` sort behavior.
- Render server-accurate totals and pagination.
- Update home/search links to use the same query contract.

Brand options may be sourced from the server or current discovery data, but must not make result counts inaccurate.

## Data flow

1. Vendor submits a product through the existing create/edit form.
2. The server trims and normalizes the brand, validates the required value for new products, and persists both display and normalized forms.
3. The customer UI serializes filters into canonical URL parameters.
4. The products endpoint validates parameters, builds a server-side query, applies sorting and pagination, and returns products plus metadata.
5. The shop page renders the returned page and metadata without applying a second sale/filter pass locally.

## Compatibility and migration

No destructive migration is required. Legacy documents with no brand remain valid for reads and can receive a brand on their next edit. Existing clients that omit new filters continue to receive the default published-product listing. No Atlas Search or separate search service is introduced.

## Error handling

- Normalize and validate brand input before persistence.
- Reject malformed category IDs, invalid numbers, invalid booleans, unsupported sort values, and invalid page/limit values with actionable `400` errors.
- Keep authentication and vendor ownership checks unchanged.
- Ensure failed product saves leave the form usable and do not create duplicate submissions.

## Verification

Add focused tests for:

- Brand normalization and required validation.
- Partial title and brand search.
- Single and multiple brand filters.
- Price, rating, stock, and sale filters.
- Sort ordering and pagination metadata.
- Invalid category and filter values.
- Vendor create/update brand persistence.
- Legacy products without brands.

Run the existing server checks, focused server tests, client tests, and client production build.

## Out of scope

- Admin-managed brand catalog or approval workflow.
- Atlas Search, Elasticsearch, or another search service.
- Vendor/store, delivery-area, trending, or attribute-specific filters.
- Unrelated authentication, payment, or checkout fixes.
