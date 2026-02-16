# CSAT Auth + Session API Testing Guide

This guide explains how to test the newly implemented authentication/session architecture and SBU access behavior.

## 1. Prerequisites

- Backend running (`npm run dev` or `npm start`)
- MongoDB connected
- At least one `SBU` record with `leadNames[]` populated
- For Google login test:
  - valid Google ID token from frontend
  - optional `GOOGLE_CLIENT_ID` set in env (recommended)

## 2. Important Test Rules

### Client context header
You must set this header explicitly in dashboard tests:
- Admin dashboard behavior: `x-client-type: admin`
- SBU dashboard behavior: `x-client-type: sbu`

### Session cookie
Auth uses cookie `csat_session`.
- Login endpoints set cookie via `Set-Cookie`.
- SBU dashboard requests must send that cookie.

### Secure cookie behavior
Cookie is configured with `secure: true` (as required in implementation plan).
- In plain `http://localhost`, some clients may not auto-store/use secure cookies.
- If that happens, copy cookie manually from `Set-Cookie` and pass it in `Cookie` header.
- For browser-style testing, use HTTPS environment.

## 3. Auth API Tests

Base URL examples use `{{baseUrl}}`.

## 3.1 Register (Email/Password)

### Request
`POST {{baseUrl}}/auth/register`

Body:
```json
{
  "name": "Test User",
  "email": "test.user@example.com",
  "password": "TestPass@123"
}
```

### Expected
- Status: `201`
- `success: true`
- user returned with:
  - `provider: "local"`
  - `role: "user"`
  - `password` not exposed

## 3.2 Login (Email/Password)

### Request
`POST {{baseUrl}}/auth/login`

Body:
```json
{
  "email": "test.user@example.com",
  "password": "TestPass@123"
}
```

### Expected
- Status: `200`
- `success: true`
- `Set-Cookie` present with `csat_session`
- response includes user + expiry info

## 3.3 Google Login

### Request
`POST {{baseUrl}}/auth/google`

Body:
```json
{
  "idToken": "<valid_google_id_token>"
}
```

### Expected
- Status: `200`
- `success: true`
- `Set-Cookie` with `csat_session`
- Role mapping behavior:
  - if user name matches any `SBU.leadNames[]`: role becomes exact `SBU.name`, and `sbuId` is set
  - otherwise role is `user`

## 3.4 Current User (`/auth/me`)

### Request
`GET {{baseUrl}}/auth/me`

Headers:
- `Cookie: csat_session=<session-token>`

### Expected
- Status `200` with valid session
- Status `401` when cookie missing/invalid/expired

## 3.5 Logout

### Request
`POST {{baseUrl}}/auth/logout`

Headers:
- `Cookie: csat_session=<session-token>`

### Expected
- Status `200`
- session invalidated in DB (`isValid=false`)
- cookie cleared

## 4. Optional Session Middleware Tests

## 4.1 Admin path should not require session

Request example:
- `GET {{baseUrl}}/api/v1/dashboard/filters`
- Header: `x-client-type: admin`
- No cookie

Expected:
- Allowed (not blocked by session middleware)

## 4.2 SBU path should require session

Request example:
- `GET {{baseUrl}}/api/v1/dashboard/filters`
- Header: `x-client-type: sbu`
- No cookie

Expected:
- `401` authentication required

## 4.3 SBU path with valid session

Request example:
- `GET {{baseUrl}}/api/v1/dashboard/filters`
- Header: `x-client-type: sbu`
- Cookie: valid `csat_session`

Expected:
- `200`
- data scoped to user `sbuId`

## 5. Role-Based Access Tests (SBU)

## 5.1 SBU cannot access another SBU details

Request:
- `GET {{baseUrl}}/api/v1/dashboard/filter/sbu/<other_sbu_id>`
- Header: `x-client-type: sbu`
- Cookie: valid SBU session

Expected:
- `403` access denied

## 5.2 SBU can access own SBU details

Request:
- `GET {{baseUrl}}/api/v1/dashboard/filter/sbu/<own_sbu_id>`
- Header: `x-client-type: sbu`
- Cookie: valid session

Expected:
- `200`
- only own SBU data

## 5.3 Scoped aggregate/search endpoints

Run with:
- `x-client-type: sbu`
- valid cookie

Test these endpoints:
- `/api/v1/dashboard/stats`
- `/api/v1/dashboard/aggregate/departments`
- `/api/v1/dashboard/aggregate/brands`
- `/api/v1/dashboard/aggregate/sbus`
- `/api/v1/dashboard/recent`
- `/api/v1/dashboard/search`
- `/api/v1/dashboard/global-search`
- `/api/v1/dashboard/department/:departmentId/records`
- `/api/v1/dashboard/bi-export?cycleId=...`
- `/api/v1/dashboard/sbu-brands-coverage?cycleId=...`

Expected:
- `200`
- all results scoped to authenticated `sbuId`

## 6. Session Lifecycle Validation

## 6.1 DB checks after login

After login/google login:
- Session document created in `sessions`
- `sessionTokenHash` stored (not raw token)
- `expiresAt` approx now + 7 days
- `isValid: true`

## 6.2 DB checks after logout

After logout:
- matching session has `isValid: false`

## 6.3 Expired session behavior

Set `expiresAt` in past for a session manually, then call any SBU dashboard endpoint.

Expected:
- treated as invalid session
- `401` for SBU client flow

## 7. Quick cURL Examples

## Register
```bash
curl -X POST "{{baseUrl}}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test.user@example.com","password":"TestPass@123"}'
```

## Login
```bash
curl -i -X POST "{{baseUrl}}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.user@example.com","password":"TestPass@123"}'
```

## SBU dashboard request (manual cookie)
```bash
curl -X GET "{{baseUrl}}/api/v1/dashboard/filters" \
  -H "x-client-type: sbu" \
  -H "Cookie: csat_session=<token>"
```

## 8. Regression Checklist

- Admin dashboard works with `x-client-type: admin` and no auth
- SBU dashboard fails without session
- SBU dashboard works with session
- Cross-SBU access blocked
- Logout invalidates session
- `/auth/me` returns current user when session valid
