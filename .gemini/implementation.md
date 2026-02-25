# User Access API Changes

## Files Changed
- `/Users/chetan/Schbang/csat-main-server/src/services/auth.service.js`
- `/Users/chetan/Schbang/csat-main-server/src/controllers/auth.controller.js`
- `/Users/chetan/Schbang/csat-main-server/src/routes/auth.routes.js`
- `/Users/chetan/Schbang/csat-main-server/src/routes/index.js`

## New APIs

### 1) PATCH `/auth/user`
Admin-only endpoint to update a user by email.

#### Authentication / Access
- Requires admin authorization middleware (`authorize({ role: 'admin' })`).
- Also works with trusted admin client headers already supported by this project.

#### Request Body (JSON)
```json
{
  "email": "chetanmarathe1000@gmail.com",
  "role": "sbu",
  "accessScopes": [
    {
      "resourceType": "sbu",
      "resourceId": "697094a84a30795777e84aec"
    },
    {
      "resourceType": "department",
      "resourceId": "697094a84a30795777e84aed"
    }
  ]
}
```

#### Keys
- `email` (string, required)
- `role` (string, optional)
  - Allowed values: `user`, `admin`, `head_department`, `sbu`
- `accessScopes` (array, optional)
  - Each item:
    - `resourceType` (string, required) -> `department` or `sbu`
    - `resourceId` (string, required) -> valid MongoDB ObjectId
- `accessScope` (array, optional alias of `accessScopes` for compatibility)
  - Do not send both `accessScopes` and `accessScope` together.

#### Update Behavior
- At least one of `role` or `accessScopes` must be provided.
- If `accessScopes` is provided, it replaces the entire existing `accessScopes` array.
- To **add** scopes: send old scopes + new scopes in the array.
- To **remove** scopes: send array without unwanted scopes.
- To clear all scopes: send `"accessScopes": []`.

#### Success Response
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "699431e24d896aab08bb42dc",
      "name": "Chetan Marathe",
      "email": "chetanmarathe1000@gmail.com",
      "provider": "google",
      "role": "sbu",
      "accessScopes": [
        {
          "resourceType": "sbu",
          "resourceId": "697094a84a30795777e84aec"
        }
      ],
      "isActive": true,
      "lastLoginAt": "2026-02-17T15:26:19.145Z",
      "createdAt": "2026-02-17T09:16:18.183Z",
      "updatedAt": "2026-02-19T00:00:00.000Z",
      "__v": 1
    }
  }
}
```

---

### 2) GET `/auth/user?email=<emailId>`
Admin-only endpoint to fetch a user by email.

#### Authentication / Access
- Requires admin authorization middleware (`authorize({ role: 'admin' })`).

#### Query Params
- `email` (string, required)

Example:
- `/auth/user?email=chetanmarathe1000%40gmail.com`

#### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "699431e24d896aab08bb42dc",
      "name": "Chetan Marathe",
      "email": "chetanmarathe1000@gmail.com",
      "provider": "google",
      "role": "sbu",
      "accessScopes": [
        {
          "resourceType": "sbu",
          "resourceId": "697094a84a30795777e84aec"
        }
      ],
      "isActive": true,
      "lastLoginAt": "2026-02-17T15:26:19.145Z",
      "createdAt": "2026-02-17T09:16:18.183Z",
      "updatedAt": "2026-02-19T00:00:00.000Z",
      "__v": 1
    }
  }
}
```

## Error Cases
- `400`: missing/invalid email, invalid role, invalid accessScopes format
- `401`: not authenticated
- `403`: authenticated but not admin
- `404`: user not found
