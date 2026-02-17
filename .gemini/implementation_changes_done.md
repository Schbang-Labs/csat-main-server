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
