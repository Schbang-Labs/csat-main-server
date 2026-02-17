# Implementation Changes Done

This file documents all changes implemented from `.gemini/implementation.md` in the same sequence (1 → 6).

## 1) Head department should get all SBUs of scoped departments
- Updated authorization scope building to auto-include all active SBU IDs for `head_department` users when they have department scopes.
- File changed:
  - `src/middleware/authorization.middleware.js`

## 2) BI Export access denied (`/api/v1/dashboard/bi-export?cycleId=...&export=csv`)
- Removed strict `departmentId` query-based authorization for BI export route.
- Added scope-aware BI export filtering using user access scopes:
  - scoped departments for `head_department`
  - scoped SBUs for `sbu`
- Added explicit 403 check if `head_department` passes an out-of-scope `departmentId`.
- Files changed:
  - `src/routes/dashboard.routes.js`
  - `src/controllers/dashboard/dashboard.controller.js`
  - `src/services/dashboard/dashboard.service.js`

## 3) Admin brands list should follow accessScopes
- Enabled scoped read access to `GET /api/v1/admin/brands` for `admin`, `head_department`, `sbu`.
- Added scope-aware brand filtering in admin service:
  - department-scope filters by department services
  - sbu-scope filters by service SBU mapping
- Files changed:
  - `src/routes/admin.routes.js`
  - `src/controllers/admin/admin.controller.js`
  - `src/services/admin/admin.service.js`

## 4) SBU Brands Coverage should follow accessScopes
- Enabled `head_department` access on `/api/v1/dashboard/sbu-brands-coverage`.
- Added scope-aware filtering in coverage service for both active and historical cycle flows:
  - by scoped SBU IDs
  - by scoped department IDs
- Files changed:
  - `src/routes/dashboard.routes.js`
  - `src/controllers/dashboard/dashboard.controller.js`
  - `src/services/dashboard/dashboard.service.js`

## 5) Admin clients list should follow accessScopes
- Enabled scoped read access to `GET /api/v1/admin/clients`.
- Added scope-aware client filtering by resolving allowed brand IDs from scoped department/SBU access.
- Files changed:
  - `src/routes/admin.routes.js`
  - `src/controllers/admin/admin.controller.js`
  - `src/services/admin/admin.service.js`

## 6) Admin SBUs list should follow accessScopes
- Enabled scoped read access to `GET /api/v1/admin/sbus`.
- Added scope-aware SBU filtering:
  - SBU role -> scoped SBU IDs
  - Head department role -> scoped department IDs (and scoped SBU IDs where present)
- Files changed:
  - `src/routes/admin.routes.js`
  - `src/controllers/admin/admin.controller.js`
  - `src/services/admin/admin.service.js`

## Additional safeguards
- Updated dashboard access context so `head_department` is not unintentionally narrowed to only the first derived SBU in unrelated endpoints.
- File changed:
  - `src/controllers/dashboard/dashboard.controller.js`

## Validation
- `npm run lint` -> passed.
- `npm test -- --runInBand` -> no tests found in repository (Jest exited with code 1 due zero test files).

## Additional Fixes (Post-Implementation)
- Fixed access behavior for:
  - `GET /api/v1/dashboard/filter/sbu/:sbuId`
  - `GET /api/v1/dashboard/response/:id`
  - `GET /api/v1/dashboard/global-search`

### What changed
- Updated SBU route authorization to allow `head_department` and enforce SBU-scope checks from access scopes.
- Updated global-search route guard to support scoped access without forcing `departmentId` query.
- Updated response route guard to allow scoped `head_department` access.
- Added scoped filtering in controller + service:
  - response detail now checks allowed SBU/department scope sets (not just single SBU).
  - global-search now applies scope using department IDs and SBU IDs across SBU, brand, client, and response result sets.

### Files changed for this add-on
- `src/routes/dashboard.routes.js`
- `src/controllers/dashboard/dashboard.controller.js`
- `src/services/dashboard/dashboard.service.js`

## Additional Fix (Coverage Scope Precision)
- Fixed `GET /api/v1/dashboard/sbu-brands-coverage` so filled/unfilled department and client calculations are strictly scoped per accessible SBU.
- Previously, a scoped user could still see fill/unfill signals influenced by other departments for the same brand.
- Now for each SBU row:
  - CSAT responses are filtered by that exact `sbuId` in the selected cycle.
  - services are limited to the current SBU context (current department / mapped SBU service).
  - client lists are filtered to the current department service mapping.

### File changed
- `src/services/dashboard/dashboard.service.js`

## Additional Fix (Filters API Multi-SBU)
- Fixed `GET /api/v1/dashboard/filters` to support multiple SBU access scopes.
- Previously only the first SBU from access scope was used.
- Now the API returns combined scoped data for all allowed SBU IDs:
  - all scoped SBUs
  - departments mapped from those SBUs
  - brands mapped to any of those SBUs
  - cycles/years as usual

### Files changed
- `src/controllers/dashboard/dashboard.controller.js`
- `src/services/dashboard/dashboard.service.js`

## Additional Fix (Multi-Object AccessScopes Across Dashboard APIs)
- Fixed dashboard APIs that previously worked only with the first `accessScopes` object for SBU/department access.
- Updated controller scope propagation to consistently pass full scoped arrays (`sbuIds`, `departmentIds`) across dashboard endpoints.
- Updated service filters and query builders to apply array scopes across:
  - `GET /api/v1/dashboard/department/summary`
  - `GET /api/v1/dashboard/filter/department/:departmentId`
  - `GET /api/v1/dashboard/filter/brand/:brandId`
  - `GET /api/v1/dashboard/filter/cycle/:cycleId`
  - `GET /api/v1/dashboard/filter/year/:year`
  - `GET /api/v1/dashboard/stats`
  - `GET /api/v1/dashboard/aggregate/sbus`
  - `GET /api/v1/dashboard/brands-filled`
  - `GET /api/v1/dashboard/recent`
  - `GET /api/v1/dashboard/global-search`
  - `GET /api/v1/dashboard/department/:departmentId/records`
- Refactored `calculateFillRates` to support multi-department and multi-SBU scope arrays for both:
  - current/live data paths
  - historical cycle paths (`BrandHistory`/`ClientHistory`)
- Removed debug logs from fill-rate helper and aligned scoped filters for consistent metrics.

### Files changed
- `src/controllers/dashboard/dashboard.controller.js`
- `src/services/dashboard/dashboard.service.js`
- `src/services/dashboard/helper.js`

### Validation
- `npm run lint` -> passed.

## Additional Fix (Head Department FillRates Alignment With Admin)
- Fixed head-department scoping for department-focused dashboard APIs where results were being over-constrained by SBU IDs in historical cycles.
- For head-department role, department-level APIs now use department-based access scope (same behavior basis as admin, but limited to allowed departments), while SBU role continues using SBU scope.
- This resolves incorrect fill-rate combinations such as:
  - `totalMappedBrands = 0` with non-zero `totalBrandsFilled`
  - `brandFillRate = 0` despite filled responses

### Updated controller scope handling
- `GET /api/v1/dashboard/filter/department/:departmentId`
- `GET /api/v1/dashboard/department/summary`
- `GET /api/v1/dashboard/department/:departmentId/records`
- `GET /api/v1/dashboard/stats` (no implicit SBU constraint for head_department unless explicit `sbuId` is requested)
- `GET /api/v1/dashboard/brands-filled`

### Files changed
- `src/controllers/dashboard/dashboard.controller.js`

### Validation
- `npm run lint` -> passed.
