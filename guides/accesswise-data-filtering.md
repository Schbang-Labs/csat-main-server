# Access-Wise Data Visibility and API Filtering

This document explains how access works in this backend for:
- SBU-wise access
- Department-wise access
- How API responses are filtered based on access scope

## 1. Core Access Model

User access is role + scoped resources.

Roles:
- `admin`
- `head_department`
- `sbu`
- `user`

Scoped resources (`User.accessScopes`):
- `resourceType: "department"` with a `department` ObjectId
- `resourceType: "sbu"` with an `sbu` ObjectId

Example access scope payload:

```json
{
  "email": "user@example.com",
  "role": "head_department",
  "accessScopes": [
    {
      "resourceType": "department",
      "resourceId": "67f0f1f77bcf86cd79943901"
    }
  ]
}
```

Where this is defined:
- `src/models/User.model.js`
- `src/services/auth.service.js` (`normalizeAccessScopes`, `updateUserByEmail`)

## 2. How Scopes Are Built at Runtime

All protected routes use `authorize(...)` from `src/middleware/authorization.middleware.js`.

At request time:
1. User scopes are read from `req.user.accessScopes`.
2. Middleware builds `req.authz.allowedResourceIds`:
- `allowedResourceIds.department = [departmentIds...]`
- `allowedResourceIds.sbu = [sbuIds...]`
3. Special rule for `head_department`:
- If department scope exists, middleware auto-adds all active SBUs under those departments into `allowedResourceIds.sbu`.
4. Route options can enforce:
- role checks
- mandatory scope presence (`requiredScopeByRole`)
- path/query/body resource ownership checks (`resourceType + resourceIdParam/resourceIdQuery/...`)

Important behavior:
- `admin` can bypass scoped checks.
- `head_department` gets department scope + inherited SBU scope.
- `sbu` gets only explicit SBU scope.

## 3. Data Relationships Used for Filtering

Filtering relies on these mappings:
- `Brand.services[]`:
  - `department` (code like `solutions`, `media`, etc.)
  - `sbuId`
- `Client.serviceMapping[]`:
  - department mapping per client/POC
- `CSATResponse`:
  - `departmentId`
  - `sbuId`
  - `brandId`
  - `cycleId`

So available data is always tied to one or more of:
- allowed `departmentId`
- allowed `sbuId`
- brands/clients that belong to those scopes

## 4. Dashboard API: Access-Wise Filtering Flow

For dashboard endpoints (`src/routes/dashboard.routes.js`):
1. Route-level authorization checks role + required scope.
2. Controller builds access context from `req.authz`.
3. Controller passes scoped IDs (`sbuIds`, `departmentIds`) into service methods.
4. Service applies Mongo filters (`buildFilterWithYear`, explicit query clauses).

Main helper:
- `src/services/dashboard/helper.js` → `buildFilterWithYear(params)`
  - Adds `departmentId` filter from `departmentId` or `departmentIds`
  - Adds `sbuId` filter from `sbuId` or `sbuIds`
  - Adds cycle/year filtering

## 5. SBU-Wise vs Department-Wise Behavior

### SBU-wise access (`role = sbu`)

Data is scoped by allowed SBU IDs:
- `CSATResponse.sbuId IN allowedSbuIds`
- Brand and client queries are reduced to brands mapped to those SBUs
- SBU path endpoints (`/filter/sbu/:sbuId`, `/sbu/:sbuId/detail`) enforce that requested `sbuId` is allowed

### Department-wise access (`role = head_department`)

Data is scoped by allowed department IDs:
- `CSATResponse.departmentId IN allowedDepartmentIds`
- User also inherits all SBU IDs under those departments
- Department-scoped endpoints check requested `departmentId` against allowed departments

## 6. Endpoint Scope Summary (Dashboard)

- `/api/v1/dashboard/filters`
  - Returns only filters in the user’s scope (departments, SBUs, brands).

- `/api/v1/dashboard/filter/department/:departmentId`
  - Department path access check for `head_department`.
  - SBU users are still restricted by their scoped SBU IDs in service query.

- `/api/v1/dashboard/filter/brand/:brandId`
- `/api/v1/dashboard/filter/cycle/:cycleId`
- `/api/v1/dashboard/recent`
- `/api/v1/dashboard/search`
- `/api/v1/dashboard/global-search`
  - Apply scope filters via `sbuIds` and/or `departmentIds`.

- `/api/v1/dashboard/filter/sbu/:sbuId`
- `/api/v1/dashboard/sbu/:sbuId/detail`
  - Requested `sbuId` must be in allowed SBU IDs for scoped roles.

- `/api/v1/dashboard/stats`
  - Extra guard in controller:
    - denies out-of-scope `departmentId`
    - denies out-of-scope `sbuId`
  - Service still applies scoped filters.

- `/api/v1/dashboard/bi-export`
- `/api/v1/dashboard/sbu-brands-coverage`
- `/api/v1/dashboard/response/:id`
  - Response/export/detail results are constrained to scope.
  - Historical cycles still stay scope-limited.

Role-specific route notes:
- `/filter/year/:year`, `/aggregate/departments`, `/aggregate/sbus` are only for `admin` and `sbu` (not `head_department`), as defined in route middleware.

## 7. Admin Read APIs Also Respect Scope

Admin routes allowing scoped read:
- `GET /api/v1/admin/sbus`
- `GET /api/v1/admin/sbus/:id`
- `GET /api/v1/admin/brands`
- `GET /api/v1/admin/brands/:id`
- `GET /api/v1/admin/clients`
- `GET /api/v1/admin/clients/:id`

Implementation:
- `src/routes/admin.routes.js` uses `allowScopedAdminRead`.
- `src/services/admin/admin.service.js` applies role-aware filters:
  - `head_department`: department-based restrictions
  - `sbu`: brand/client/SBU restrictions derived from allowed SBU IDs
  - out-of-scope reads throw access denied (403)

## 8. Practical Examples

Example A: `sbu` user with scope `[SBU-1]`
- Can only see responses where `sbuId = SBU-1`
- Filter options only include brands/departments connected to `SBU-1`
- Cannot open `/dashboard/filter/sbu/:id` for other SBU IDs

Example B: `head_department` user with scope `[Department-X]`
- Can see data for `departmentId = Department-X`
- Automatically gets SBUs under Department-X in runtime scope
- Department query/path outside Department-X is denied

Example C: `admin`
- Sees full data unless custom app logic limits it

## 9. Source Files (Reference)

- `src/models/User.model.js`
- `src/middleware/authorization.middleware.js`
- `src/routes/dashboard.routes.js`
- `src/controllers/dashboard/dashboard.controller.js`
- `src/services/dashboard/helper.js`
- `src/services/dashboard/dashboard.service.js`
- `src/routes/admin.routes.js`
- `src/services/admin/admin.service.js`
- `src/services/auth.service.js`
