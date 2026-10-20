# Project TODO

## Product brands and advanced filtering

- [x] Define and approve the product brand/filtering specification.
- [x] Create the implementation plan.
- [x] Add the optional product brand fields and pure filter-contract helpers.
- [ ] Review and integrate the server-side product filters, pagination, totals, and brand persistence.
- [ ] Add the vendor brand field to product create/edit forms.
- [ ] Replace client-side sale filtering with canonical URL-driven advanced filters.
- [ ] Add focused tests for API filtering, brand persistence, and query serialization.
- [ ] Run the final server tests, client lint/build, and whole-branch review.

## Existing follow-ups

- [ ] Fix or triage the existing client lint errors and warnings outside this feature.
- [ ] Add integration coverage for authentication, stock reservation, order idempotency, and payment verification.
- [ ] Review client environment files for accidentally tracked secrets.
- [ ] Decide whether access tokens should remain in local storage or move to a safer storage strategy.
- [ ] Move browser geocoding behind a controlled proxy/cache with provider rate-limit handling.
