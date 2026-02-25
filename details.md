# API Details: `POST /api/v1/admin/cycles/:cycleId/finalize`

---

## 📌 Overview

This endpoint **finalizes a CSAT cycle** by permanently freezing the state of all organizational entities (SBUs, Brands, Clients) for that cycle as historical snapshots, and then linking all CSAT responses to those snapshots. After finalization, the cycle is marked as `completed` and `isActive: false`.

This is typically called **once at the end of a CSAT cycle** to archive the data.

---

## 🔗 Route Definition

```
POST /api/v1/admin/cycles/:cycleId/finalize
```

**File:** `src/routes/admin.routes.js` → Line 967
```js
router.post('/cycles/:cycleId/finalize', requireAdmin, finalizeCycle);
```

**Auth:** Requires `role: 'admin'` (enforced via `requireAdmin` middleware using `authorization.middleware.js`).

---

## 📥 Request

### Path Parameter
| Param | Type | Required | Description |
|---|---|---|---|
| `cycleId` | `string` (MongoDB ObjectId) | ✅ Yes | The ID of the cycle to finalize |

### Query Parameter
| Param | Type | Default | Description |
|---|---|---|---|
| `force` | `boolean` (`"true"`) | `false` | If `true`, allows re-finalization of an already finalized cycle |

### Request Body (optional)
```json
{
  "force": true
}
```

> `force` can be passed either as a query param (`?force=true`) or in the request body as `{ "force": true }`.

---

## 📤 Response

### ✅ Success (200 OK)
```json
{
  "success": true,
  "message": "Cycle \"Cycle 5\" finalized successfully",
  "data": {
    "cycle": {
      "id": "ObjectId",
      "name": "Cycle 5",
      "year": 2025,
      "status": "completed",
      "isFinalized": true,
      "finalizedAt": "2025-11-30T00:00:00.000Z"
    },
    "snapshots": {
      "sbus": 12,
      "clients": 45,
      "brands": 30
    },
    "updates": {
      "totalResponses": 200,
      "updated": 195,
      "skipped": 5,
      "errors": 0,
      "historyRecords": {
        "sbus": 12,
        "clients": 45,
        "brands": 30
      }
    },
    "wasForced": false
  }
}
```

### ⚠️ Already Finalized (409 Conflict)
```json
{
  "success": false,
  "message": "Cycle \"Cycle 5\" (2025) has already been finalized. To re-finalize, pass force=true ...",
  "data": {
    "cycle": { ... },
    "hint": "Add ?force=true to the URL or {\"force\": true} in the request body to re-finalize."
  }
}
```

### ❌ Cycle Not Found (404)
```json
{
  "success": false,
  "message": "Cycle not found"
}
```

### ❌ Server Error (500)
```json
{
  "success": false,
  "message": "..."
}
```

---

## 🧭 Full Code Flow

```
POST /api/v1/admin/cycles/:cycleId/finalize
        │
        ▼
[Middleware] requireAdmin  →  authorize({ role: 'admin' })
        │
        ▼
[Controller] finalizeCycle()
  src/controllers/admin/admin.controller.js → Line 516
        │
        │  1. Extracts cycleId from params
        │  2. Resolves force flag from query OR body
        │  3. Verifies the cycle exists (Cycle.findById)
        │     → 404 if not found
        │  4. Checks isFinalized flag
        │     → 409 Conflict if already finalized AND force is false
        │  5. Logs warn/info based on force flag
        │
        ▼
[Service] finalizeCycleHistory(cycleId, { force })
  src/services/history.service.js → Line 344
        │
        │  Step 0: Re-validate cycle and isFinalized guard
        │     → Throws if already finalized AND force=false
        │     → Logs warning if force re-finalization
        │
        │  Step 1: snapshotAllForCycle(cycleId)
        │     → Creates history snapshots for ALL active entities
        │
        │  Step 2: updateCSATResponseHistoryIds(cycleId)
        │     → Links all CSAT responses to history IDs
        │
        │  Step 3: Cycle.findByIdAndUpdate(cycleId, {
        │     status: 'completed',
        │     isActive: false,
        │     isFinalized: true,
        │     finalizedAt: new Date()
        │  })
        │
        ▼
Returns combined result object to controller
```

---

## 🔍 Step-by-Step Internal Process

### Step 1 — `snapshotAllForCycle(cycleId)`
📁 `src/services/history.service.js` → Line 141

Fetches **all active entities** from DB simultaneously:
```js
const [sbus, clients, brands] = await Promise.all([
  SBU.find({ isActive: true }),
  Client.find({ isActive: true }),
  Brand.find({ isActive: true }).populate('pocs'),
]);
```

Then for each entity, calls the respective snapshot function:

---

#### 1a. `snapshotSBU(sbu, cycleId, 'cycle_start')`
📁 Line 31

Creates a snapshot in the **`sbu_history`** MongoDB collection.

Fields stored:
| Field | Source |
|---|---|
| `sbuId` | SBU's `_id` |
| `cycleId` | The cycle being finalized |
| `executiveVP` | SBU's current `executiveVP` |
| `associateVP` | SBU's current `associateVP` |
| `associateVPs[]` | SBU's current `associateVPs` array |
| `creativeDirector` | SBU's current `creativeDirector` |
| `leadNames[]` | SBU's current `leadNames` array |
| `departmentId` | SBU's department reference |
| `brands[]` | Array of brand ObjectIds associated with SBU |
| `snapshotReason` | `'cycle_start'` |

Uses `SBUHistory.upsertSnapshot()` → `findOneAndUpdate({ sbuId, cycleId }, ..., { upsert: true })`.
**Unique index** on `(sbuId, cycleId)` ensures no duplicates.

---

#### 1b. `snapshotClient(client, cycleId, 'cycle_start')`
📁 Line 65

Creates a snapshot in the **`client_history`** MongoDB collection.

Fields stored:
| Field | Source |
|---|---|
| `clientId` | Client's `_id` |
| `cycleId` | The cycle being finalized |
| `brandId` | Client's linked brand |
| `name` | Client/POC name at time of snapshot |
| `phone` | Client phone |
| `email` | Client email |
| `serviceMapping[]` | Array of `{ department, isActive }` |
| `snapshotReason` | `'cycle_start'` |

---

#### 1c. `snapshotBrand(brand, cycleId, 'cycle_start')`
📁 Line 98

Creates a snapshot in the **`brand_history`** MongoDB collection.

If brand's POCs are not already populated, it queries the **`Client`** collection:
```js
const clients = await Client.find({ brandId: brand._id, isActive: true });
pocIds = clients.map(c => c._id);
```

Fields stored:
| Field | Source |
|---|---|
| `brandId` | Brand's `_id` |
| `cycleId` | The cycle being finalized |
| `name` | Brand name at time of snapshot |
| `slug` | Brand slug |
| `secondBrainId` | Brand's secondBrainId |
| `services[]` | Array of `{ department, sbuId, isActive }` |
| `pocs[]` | Array of active Client `_id`s |
| `snapshotReason` | `'cycle_start'` |

---

### Step 2 — `updateCSATResponseHistoryIds(cycleId)`
📁 `src/services/history.service.js` → Line 224

After all snapshots are created, this function **back-fills the history references** into every CSAT Response document for this cycle.

**Sub-steps:**

1. **Fetches all history records** just created for this cycle:
```js
const [sbuHistories, clientHistories, brandHistories] = await Promise.all([
  SBUHistory.find({ cycleId }),
  ClientHistory.find({ cycleId }),
  BrandHistory.find({ cycleId }),
]);
```

2. **Builds lookup Maps** (`entityId → historyId`):
```js
const sbuMap = new Map();   // sbuId   → SBUHistory._id
const clientMap = new Map(); // clientId → ClientHistory._id
const brandMap = new Map();  // brandId  → BrandHistory._id
```

3. **Fetches CSAT Responses** that are missing at least one history reference:
```js
CSATResponse.find({
  cycleId,
  $or: [
    { brandHistoryId: null },
    { clientHistoryId: null },
    { sbuHistoryId: null },
  ],
})
```

4. **Updates each response** individually, setting:
   - `brandHistoryId` → from `brandMap`
   - `clientHistoryId` → from `clientMap`
   - `sbuHistoryId` → from `sbuMap`

Returns summary stats: `{ totalResponses, updated, skipped, errors }`.

---

### Step 3 — Mark Cycle as Finalized
📁 `src/services/history.service.js` → Line 393

```js
await Cycle.findByIdAndUpdate(cycleId, {
  status: 'completed',
  isActive: false,
  isFinalized: true,
  finalizedAt: new Date(),
});
```

The cycle is now permanently marked as complete and inactive.

---

## 🗂️ MongoDB Collections Affected

| Collection | Action | Description |
|---|---|---|
| `sbu_history` | Upsert | One document per SBU per cycle |
| `client_history` | Upsert | One document per Client per cycle |
| `brand_history` | Upsert | One document per Brand per cycle |
| `csat_responses` | Update | Sets `brandHistoryId`, `clientHistoryId`, `sbuHistoryId` |
| `cycles` | Update | Sets `status`, `isActive`, `isFinalized`, `finalizedAt` |

---

## 🛡️ Idempotency & Safety Guards

| Guard | Location | Behavior |
|---|---|---|
| **Cycle not found** | Controller + Service | Returns 404 |
| **Already finalized (no force)** | Controller → Line 541 | Returns 409 Conflict |
| **Already finalized (no force)** | Service → Line 355 | Throws error |
| **Force re-finalization** | Controller → Line 560, Service → Line 363 | Logs warning, proceeds with re-snapshot |
| **Individual snapshot errors** | Service → Lines 169, 186, 201 | Logged, but does NOT stop the overall finalization (best-effort) |
| **Individual CSAT update errors** | Service → Line 306 | Logged, counted in `errors`, does NOT stop the run |

> **Important:** All snapshot functions use `upsert: true`, so re-running (with `force=true`) safely overwrites the previous snapshot instead of creating duplicates. The unique compound index `(entityId, cycleId)` enforces this.

---

## 📐 Data Model: History Fields in CSATResponse

After finalization, each `CSATResponse` document gains three back-references:

```
CSATResponse
├── brandId         → Brand (live/current)
├── clientId        → Client (live/current)
├── sbuId           → SBU (live/current)
│
├── brandHistoryId  → BrandHistory  (snapshot at this cycle)   ← set by finalize
├── clientHistoryId → ClientHistory (snapshot at this cycle)   ← set by finalize
└── sbuHistoryId    → SBUHistory    (snapshot at this cycle)   ← set by finalize
```

This allows the dashboard to query historical data accurately — even after the entities (brands/clients/SBUs) have been updated in subsequent cycles.

---

## 🔄 Cycle Status Lifecycle

```
upcoming  →  active  →  closed  →  completed
                                       ↑
                          (set by /finalize endpoint)
                          + isFinalized: true
                          + isActive: false
                          + finalizedAt: <timestamp>
```

---

## 📁 Files Involved

| File | Role |
|---|---|
| `src/routes/admin.routes.js` | Route definition + Swagger docs + auth middleware |
| `src/controllers/admin/admin.controller.js` | `finalizeCycle()` controller function |
| `src/services/history.service.js` | Core logic: `finalizeCycleHistory()`, `snapshotAllForCycle()`, `updateCSATResponseHistoryIds()` |
| `src/models/cycle.model.js` | `Cycle` model — updated with `isFinalized`, `finalizedAt`, `status` |
| `src/models/sbuHistory.model.js` | `SBUHistory` model + `upsertSnapshot()` static |
| `src/models/brandHistory.model.js` | `BrandHistory` model + `upsertSnapshot()` static |
| `src/models/clientHistory.model.js` | `ClientHistory` model + `upsertSnapshot()` static |
| `src/models/csatResponse.model.js` | `CSATResponse` model — `brandHistoryId`, `clientHistoryId`, `sbuHistoryId` fields |
| `src/middleware/authorization.middleware.js` | `authorize()` middleware enforcing `admin` role |

---

## 💡 Why This Exists

Over time, brands can change their SBU assignments, leadership can change, and POCs can be updated. The CSAT dashboard needs to be able to show **"what was the state of this brand/SBU/client during Cycle 5?"** — even years later.

By running `/finalize`, the system:
1. **Freezes the exact state** of all entities as they were during that cycle
2. **Links CSAT responses** to those frozen snapshots
3. **Ensures historical dashboard queries** always reflect the accurate data from that period

Without finalization, historical views would incorrectly show the *current* (modified) state of an entity, rather than its state at the time the CSAT was submitted.
