# Service Strategy + CSAT Service-Form Implementation

## Overview
- Added a new `Service` master model scoped to `Department`.
- Enabled service-level CSAT submissions on the existing webhook by detecting `payload.service`.
- Extended data structures to track subservices on Brand/Client and filled service IDs on CSAT responses.

## Data Model Changes
- `Service` (new collection: `services`)
  - `name`, `normalizedName`, `departmentId`, `description`, `isActive`
  - Unique index: `(departmentId, normalizedName)`
- `Department.services: [ServiceId]`
- `Brand.services[].subservices: [ServiceId]`
- `Client.serviceMapping[].subservices: [ServiceId]`
- `CSATResponse.services: [ServiceId]`
- `BrandHistory.services[].subservices: [ServiceId]`
- `ClientHistory.serviceMapping[].subservices: [ServiceId]`

## Admin APIs
- `POST /api/v1/admin/services`
- `GET /api/v1/admin/services`
- `GET /api/v1/admin/services/:id`
- `PUT /api/v1/admin/services/:id`
- `DELETE /api/v1/admin/services/:id` (soft delete via `isActive=false`)

### API Notes
- Service create accepts `departmentId` or `departmentName`.
- Service name uniqueness is enforced per department.
- On service creation, `Department.services` is updated with `$addToSet`.
- Brand/Client create-update validate `subservices` belong to the same mapped department.

## Webhook Behavior
Endpoint: `POST /api/v1/webhook/csat`

### Core form path
- Trigger: `service` is absent or empty.
- Behavior: Existing core create/update flow remains active for `brand + client + cycle + department`.
- Safety: Existing `services` array is preserved on update.

### Service form path
- Trigger: `service` present and non-empty.
- Behavior:
  - Resolve service by `(departmentId + normalizedName(service))`.
  - Find existing core response by `(clientId + departmentId + cycleId)`.
  - If missing core response, return `400`.
  - Write payload block to `response.data[rawServiceName]`.
  - Add service `_id` to `response.services` (deduped).
  - Update `submittedAt`.

### Payload examples
Core form:
```json
{
  "clientPhone": "9876543210",
  "departmentName": "solutions",
  "data": {
    "coreMetrics": {
      "overallSatisfaction": 4,
      "likelihoodToRecommend": 5
    },
    "comment": "Great service overall!"
  }
}
```

Service form:
```json
{
  "clientPhone": "9876543210",
  "departmentName": "solutions",
  "service": "Performance Marketing",
  "data": {
    "coreMetrics": {
      "overallSatisfaction": 5,
      "likelihoodToRecommend": 5
    },
    "comment": "Strong service delivery"
  }
}
```

## Migration
Script: `scripts/migrateServiceStrategy.js`

Run:
```bash
npm run migrate:service-strategy
```

What it initializes:
- `Department.services = []` when missing/null
- `Brand.services[].subservices = []` when missing
- `Client.serviceMapping[].subservices = []` when missing
- `CSATResponse.services = []` when missing/null

## Verification Checklist
1. Create service in a department; duplicate name in same department should fail.
2. Submit core webhook payload; response created/updated normally.
3. Submit service webhook payload after core; `data[serviceName]` and `services[]` update.
4. Repeat same service webhook; no duplicate service IDs in `services[]`.
5. Submit service webhook before core; API returns `400`.
