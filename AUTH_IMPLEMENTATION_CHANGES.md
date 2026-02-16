# CSAT Authentication & Session Implementation - Detailed Change Log

This document records the exact backend implementation completed from `llm/implementation.md`.

## 1. Implemented Architecture

Implemented exactly as requested:
- Google OAuth + Email/Password auth
- Session-based authentication (no JWT bearer route guards)
- SBU role assignment via `SBU.leadNames[]`
- Optional session middleware driven by `x-client-type`
- Multi-dashboard support:
  - `x-client-type: admin` -> no session enforcement
  - `x-client-type: sbu` -> session required + SBU-scoped access

## 2. New Models

### `src/models/User.model.js`
Added `User` schema:
- `name`
- `email` (unique, indexed)
- `password` (bcrypt hash or `null`)
- `provider` (`local` | `google`)
- `role` (`admin` | `user` | `<sbuName>`)
- `sbuId`
- `isActive`
- `lastLoginAt`
- timestamps

### `src/models/Session.model.js`
Added `Session` schema:
- `userId`
- `sessionTokenHash` (SHA256 hash)
- `expiresAt`
- `isValid`
- `ipAddress`
- `userAgent`
- timestamps

Security:
- Session token is stored hashed only.
- TTL index added on `expiresAt`.

### Model exports updated
Updated `src/models/index.js`:
- Added exports for `User` and `Session`.

## 3. Database Integration Updates

### `src/config/database/dbSync.js`
Updated DB sync and verification to include:
- `users`
- `sessions`

### `src/config/database/init.js`
Updated cleanup flow to include:
- `users`
- `sessions`

## 4. New Services

### `src/services/sbuRole.service.js`
Added SBU role mapping logic:
- normalizes names
- checks `SBU.leadNames[]`
- returns:
  - matched: `{ role: sbu.name, sbuId: sbu._id }`
  - unmatched: `{ role: "user", sbuId: null }`

### `src/services/session.service.js`
Added session lifecycle utilities:
- `SESSION_COOKIE_NAME = csat_session`
- `createSession()`
- `validateSessionToken()`
- `invalidateSessionToken()`
- `setSessionCookie()`
- `clearSessionCookie()`
- `hashSessionToken()`

Cookie config implemented exactly per spec:
- `httpOnly: true`
- `secure: true`
- `sameSite: strict`
- 7-day max age

### `src/services/auth.service.js`
Added auth logic:
- local registration
- local login with bcrypt verification
- Google ID token verification via Google tokeninfo endpoint
- OAuth user create/update with role mapping
- current-user lookup from session token

## 5. New Middleware

### `src/middleware/clientContext.middleware.js`
Implemented:
- reads `x-client-type`
- sets `req.clientType`
- allowed values: `admin`, `sbu`
- fallback: `unknown`

### `src/middleware/optionalSession.middleware.js`
Implemented core behavior:
- if `req.clientType !== "sbu"` -> skip validation
- if `req.clientType === "sbu"` -> validate `csat_session`
- attaches `req.user` when valid
- sets `req.user = null` when invalid/missing

## 6. New Auth Controller + Routes

### `src/controllers/auth.controller.js`
Added endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/logout`
- `GET /auth/me`

### `src/routes/auth.routes.js`
Mapped above endpoints.

## 7. App Wiring (Global Integration)

### `src/app.js`
Integrated global flow in request lifecycle:
1. `cookie-parser`
2. `clientContextMiddleware`
3. `optionalSessionMiddleware`
4. controllers/routes

Also added:
- `app.use('/auth', authRoutes)`
- CORS allowed header update for `X-Client-Type` / `x-client-type`

## 8. Role-Based SBU Access Enforcement

### `src/controllers/dashboard/dashboard.controller.js`
Implemented SBU access guard in controllers:
- For `x-client-type: sbu`:
  - requires valid `req.user`
  - requires active user
  - requires `user.sbuId`
- Denies cross-SBU route access (e.g. `/dashboard/filter/sbu/:sbuId` mismatch)
- Injects scoped `sbuId` into service calls

### `src/services/dashboard/dashboard.service.js`
Updated services to support SBU-scoped data where required:
- filter options scoped by SBU
- department/brand/cycle/year filters scoped by SBU
- stats/aggregations scoped by SBU
- recent/global/global-entity search scoped by SBU
- department records scoped by SBU
- BI export scoped by SBU
- SBU brands coverage optionally scoped by SBU
- response-by-id supports optional SBU constraint

## 9. Documentation/Discovery Update

### `src/routes/index.js`
Updated API root response documentation block to include auth endpoints:
- `/auth/register`
- `/auth/login`
- `/auth/google`
- `/auth/logout`
- `/auth/me`

## 10. Final Notes

- No JWT bearer authorization was introduced.
- Authentication is session DB validation only.
- `x-client-type` now controls whether session is optional (`admin`) or required (`sbu`).
