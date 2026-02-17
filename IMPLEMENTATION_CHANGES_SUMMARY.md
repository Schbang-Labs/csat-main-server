# Implementation Changes Summary

This file documents the backend changes implemented based on the updated secure plan (`.gemini/implementation.md`).

## 1. Access Model Migration

- Replaced legacy user role shape (`sbuId` + dynamic role mapping) with fixed roles and scoped access.
- Updated user schema:
  - `role` enum: `user`, `admin`, `head_department`, `sbu`
  - `accessScopes`: array of `{ resourceType: "department" | "sbu", resourceId: ObjectId }`
- File changed:
  - `src/models/User.model.js`

## 2. Removed Lead-Name Role Assignment

- Removed automatic role assignment via SBU `leadNames` during Google login.
- Deleted old role-mapping service.
- Files changed:
  - `src/services/auth.service.js`
  - `src/services/sbuRole.service.js` (deleted)

## 3. Auth Behavior Updates

- Register and Google login now default to:
  - `role: "user"`
  - `accessScopes: []`
- Added normalization in auth login flows to handle legacy records:
  - invalid role -> fallback to `user`
  - missing `accessScopes` -> fallback to `[]`
- File changed:
  - `src/services/auth.service.js`

## 4. New Authorization Middleware

- Added centralized authorization middleware with:
  - role validation
  - resource scope validation (`department` / `sbu`)
  - trusted admin client bypass (`x-client-type: admin` + `x-client-secret`)
  - standardized responses:
    - `401`: `Unauthorized. Login required.`
    - `403`: `Access denied. Insufficient role permissions.`
    - `403`: `Access denied. You do not have access to this resource.`
- New file:
  - `src/middleware/authorization.middleware.js`

## 5. Route Protection Added

- Admin API is now protected via `authorize({ roles: ["admin"] })`.
- Dashboard routes are protected with scoped authorization wrappers for:
  - general dashboard access
  - department param/query scope checks
  - sbu param scope checks
- Files changed:
  - `src/routes/admin.routes.js`
  - `src/routes/dashboard.routes.js`

## 6. Dashboard Controller Refactor

- Removed old inline `req.user.sbuId` enforcement logic.
- Dashboard controller now consumes `req.authz` context populated by middleware.
- File changed:
  - `src/controllers/dashboard/dashboard.controller.js`

## 7. `/auth/me` Response Update

- Updated `/auth/me` to return the access-control shape used by frontend:
  - `_id`, `name`, `email`, `role`, `accessScopes`
- Updated unauthenticated response message to plan format:
  - `Unauthorized. Login required.`
- File changed:
  - `src/controllers/auth.controller.js`

## 8. CORS Header Update

- Added support for trusted admin secret header:
  - `X-Client-Secret`
  - `x-client-secret`
- File changed:
  - `src/app.js`

## 9. User Migration Script Added

- Added script to migrate existing users:
  - sets `role = "user"`
  - sets `accessScopes = []`
  - removes legacy `sbuId`
- New file:
  - `scripts/resetUserAccessScopes.js`
- Added npm script:
  - `migrate:user-access-scopes`
- File changed:
  - `package.json`

## 10. Verification Performed

- Targeted ESLint passed for all modified files.
- Runtime import check passed:
  - `node -e "import('./src/app.js')..."`
- Note:
  - Full repo lint currently has many pre-existing unrelated lint issues outside this implementation scope.
