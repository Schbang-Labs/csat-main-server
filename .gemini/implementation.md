CSAT Backend – UPDATED SECURE IMPLEMENTATION PLAN (Role + Access Control Upgrade)

Role-Driven Access System with Department & SBU Mapping
(Node.js + Express | Session Based Auth)

1. Overview — What Changes From Previous Plan

This update introduces a Role + Resource Access Model replacing the earlier automatic SBU role assignment via leadNames.

❌ Removed
Auto SBU role mapping using leadNames during login


All users now register/login as:

role = "user"


Admin manually upgrades roles later.

✅ New Additions

4 Standard Roles

Access Mapping Array inside User Model

Central Role-Based Authorization Middleware

Department + SBU Scoped Access

Strict Access Denied Responses

2. Updated Role System

User roles are now fixed to:

"user"
"admin"
"head_department"     // renamed from HeadDepartment for consistency
"sbu"


Role meaning:

Role	Meaning
user	Normal logged in user (no restricted access)
admin	Trusted internal admin
head_department	Head of specific departments
sbu	SBU-level access user
3. Updated User Schema (IMPORTANT CHANGE)

Replace previous role structure with Access Control Array.

User Model (UPDATED)
User {
   _id: ObjectId
   name: String
   email: String (unique)

   password: String | null
   provider: "local" | "google"

   role: String
   accessScopes: [
      {
         resourceType: String,   // "department" | "sbu"
         resourceId: ObjectId
      }
   ]

   isActive: Boolean
   lastLoginAt: Date

   createdAt
   updatedAt
}

Why accessScopes Instead of Simple Array?

Future-proof design:

User can hold BOTH:
department access
sbu access


Example:

accessScopes: [
   { resourceType: "department", resourceId: DeptId1 },
   { resourceType: "department", resourceId: DeptId2 }
]


OR

accessScopes: [
   { resourceType: "sbu", resourceId: SbuId1 }
]

4. Registration & Login Behaviour (UPDATED)
Register
POST /auth/register


New Rule:

ALL USERS DEFAULT:

role = "user"
accessScopes = []


No automatic role assignment.

Google OAuth Login
OLD Behaviour:
Search leadNames → assign SBU role

NEW Behaviour:
Always create/login as:

role = "user"
accessScopes = []


Role upgrades handled manually by admin.

5. Role Assignment Strategy (Admin Controlled)

Admin panel or backend scripts will update:

role
accessScopes[]


Examples:

Head of Department User
role = "head_department"

accessScopes = [
   { resourceType: "department", resourceId: Dept1 },
   { resourceType: "department", resourceId: Dept2 }
]

SBU User
role = "sbu"

accessScopes = [
   { resourceType: "sbu", resourceId: SbuId1 }
]

6. Authorization Strategy (NEW CORE SYSTEM)

Authentication still uses:

Session Cookie (csat_session)


Authorization now uses:

req.user.role
req.user.accessScopes

7. New Authorization Middleware

Create:

middleware/authorization.middleware.js


This middleware determines:

Does user have permission to access this API?

Middleware Logic Flow
IF req.clientType === "admin" AND trusted
   → allow request (existing behaviour)

IF req.clientType === "sbu"
   → require req.user
   → check role
   → check accessScopes

API-Level Usage Pattern

Controller or route can define:

requiredRole
requiredResourceType
resourceIdSource


Example:

authorize({
   roles: ["admin", "head_department"],
   resourceType: "department",
   resourceIdParam: "departmentId"
})

Validation Steps
1. Check req.user exists
2. Check role allowed
3. If resourceType defined:
      verify resourceId exists in accessScopes

8. Updated Request Lifecycle
Incoming Request
      ↓
clientContextMiddleware
      ↓
optionalSessionMiddleware
      ↓
authorizationMiddleware (NEW)
      ↓
Controller

9. Unauthorized & Access Denied Responses (MANDATORY)

Standardized response format:

❌ Unauthenticated (No Session)
HTTP 401

{
   success: false,
   message: "Unauthorized. Login required."
}

❌ Role Not Allowed
HTTP 403

{
   success: false,
   message: "Access denied. Insufficient role permissions."
}

❌ Resource Access Not Allowed
HTTP 403

{
   success: false,
   message: "Access denied. You do not have access to this resource."
}

10. /auth/me API (UPDATED RESPONSE)

This endpoint becomes the central authority for frontend access logic.

Response Shape
GET /auth/me

{
   _id,
   name,
   email,
   role,
   accessScopes: [
      {
         resourceType,
         resourceId
      }
   ]
}


Frontend middleware will rely on this.

11. Folder Structure Updates

Add new middleware:

src/
 ├── middleware/
 │     ├── clientContext.middleware.js
 │     ├── optionalSession.middleware.js
 │     └── authorization.middleware.js   ← NEW


Remove:

sbuRole.service.js  (no longer required)

12. Example Access Scenarios
🟢 Admin Dashboard
clientType: admin
trusted client → bypass auth middleware

🔵 Head Department Dashboard
role = head_department
accessScopes = departmentIds


API Example:

GET /departments/:departmentId/reports


Middleware verifies:

departmentId exists in accessScopes

🔵 SBU Dashboard
role = sbu
accessScopes = sbuIds


User sees only assigned SBU data.

13. Security Notes (UNCHANGED)

Still enforce:

bcrypt hashing
SHA256 session token
httpOnly secure cookies
ADMIN_CLIENT_SECRET in ENV only

14. Migration Notes (VERY IMPORTANT)

Since old plan already implemented:

Remove From Codebase
leadNames role mapping logic
sbuRole.service.js

Update User Schema

Add:

role enum updated
accessScopes array

Existing Users

Run migration:

SET role = "user"
SET accessScopes = []

15. Final Updated Architecture Summary

Authentication:

Session Cookie Validation


Authorization:

Role + accessScopes verification


Client Trust:

x-client-type + x-client-secret


Admin:

Bypasses auth via trusted client validation