# CSAT Server - Progress Document

> **Last Updated:** 2026-01-18  
> **Purpose:** Track development progress so new agents/developers can pick up from where we left off.

---

## 📋 Project Overview

The **CSAT Server** is a Node.js/Express backend service for handling customer satisfaction data processing. It supports:
- **Multi-cycle CSAT surveys** (6 cycles per year)
- **Historical data tracking** for SBUs, Brands, and Clients across cycles
- **7 Department types** (Solutions, Media, Tech, SEO, MarTech, Fluence, SMP)
- **SBU/POD management** with leadership tracking per cycle

---

## ✅ Completed Steps

### 1. Initial Setup (2026-01-06)
- Copied nsm-server codebase as the foundation
- Removed all NSM-related code and branding
- Renamed package to `csat-server`

### 2. CSAT Data Models (2026-01-09)
Created comprehensive MongoDB models in `src/models/`:

| Model | File | Description |
|-------|------|-------------|
| **Department** | `department.model.js` | 7 service departments (Solutions, Media, Tech, SEO, MarTech, Fluence, SMP) |
| **SBU** | `sbu.model.js` | Strategic Business Units/PODs for Brand Solutions |
| **Brand** | `brand.model.js` | Client brands with service mappings |
| **Client** | `client.model.js` | POC (Point of Contact) details per brand |
| **Cycle** | `cycle.model.js` | CSAT survey cycles (6 per year, May-December) |
| **CSATResponse** | `csatResponse.model.js` | Individual survey responses with schemaless data field |

### 3. Historical Data Models (2026-01-16)
Created history models for tracking per-cycle snapshots:

| Model | File | Description |
|-------|------|-------------|
| **BrandHistory** | `brandHistory.model.js` | Brand service mappings at each cycle |
| **ClientHistory** | `clientHistory.model.js` | Client details snapshot per cycle |
| **SBUHistory** | `sbuHistory.model.js` | SBU leadership (VP, directors, leads) per cycle |

### 4. Dashboard APIs (2026-01-09 - 2026-01-16)

Implemented comprehensive dashboard APIs:

| API Category | Endpoints |
|--------------|-----------|
| **Filters** | Filter by Department, Brand, Cycle, Year, SBU |
| **Aggregations** | Aggregate by Departments, Brands, SBUs, Cycles |
| **Statistics** | Dashboard stats with optional filters |
| **Coverage** | Brands Filled/Unfilled tracking |
| **Drill-down** | Department Records, SBU Detail |
| **Search** | Global search across all historical data |
| **Recent** | Recent responses list |

### 5. CSAT/NPS Score Calculations (2026-01-16)
- **Overall CSAT**: Average of all metrics EXCEPT `likelihoodToRecommend`
- **Overall NPS**: Average of `likelihoodToRecommend` metric
- Integrated into all filter and aggregation APIs

### 6. Historical Data Enrichment (2026-01-18)
- **CSATResponse model updated** with `brandHistoryId`, `clientHistoryId`, `sbuHistoryId` fields
- **`enrichWithHistoricalData()` helper** automatically enriches responses with historical snapshots for older cycles
- **Priority 1**: Uses stored historyIds directly
- **Priority 2**: Falls back to entityId + cycleId lookup for legacy data

### 7. Cycle 4 Seeding Scripts (2026-01-17 - 2026-01-18)

| Script | Purpose |
|--------|---------|
| `scripts/cycle4/seedCycle4BrandsAndClients.js` | Seeds brands and clients from Cycle 4 data, creates BrandHistory and ClientHistory |
| `scripts/cycle4/seedCycle4SBUs.js` | Seeds SBUs for all 7 departments with department-specific SBU data, creates SBUHistory |
| `scripts/cycle4/seedCycle4CSATResponses.js` | Seeds CSAT responses with full history ID tracking |

### 8. Cycle 5 Seeding Scripts (2026-01-18)

| Script | Purpose |
|--------|---------|
| `scripts/cycle5/seedSBUs.js` | Seeds SBUs for Cycle 5 |
| `scripts/cycle5/seedBrands.js` | Seeds brands with SBU links |
| `scripts/cycle5/seedClients.js` | Seeds POC clients |
| `scripts/cycle5/seedCSATResponses.js` | Seeds CSAT responses with history ID tracking |

---

## 📁 Current Project Structure

```
csat-server/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   │   └── dashboard/
│   │       └── dashboard.controller.js
│   ├── middleware/
│   ├── models/
│   │   ├── department.model.js
│   │   ├── sbu.model.js
│   │   ├── sbuHistory.model.js
│   │   ├── brand.model.js
│   │   ├── brandHistory.model.js
│   │   ├── client.model.js
│   │   ├── clientHistory.model.js
│   │   ├── cycle.model.js
│   │   ├── csatResponse.model.js
│   │   └── index.js
│   ├── routes/
│   │   └── dashboard.routes.js
│   ├── services/
│   │   └── dashboard/
│   │       ├── dashboard.service.js
│   │       └── helper.js
│   └── utils/
├── docs/
│   ├── progress.md         # This file
│   ├── info.md             # Architecture documentation
│   └── Cycle 4/            # Cycle 4 specific data
├── scripts/
│   ├── seedDepartments.js
│   ├── seedSBUs.js
│   ├── seedBrands.js
│   ├── seedClients.js
│   ├── cycle4/
│   │   ├── seedCycle4BrandsAndClients.js
│   │   ├── seedCycle4SBUs.js
│   │   └── seedCycle4CSATResponses.js
│   └── cycle5/
│       ├── seedSBUs.js
│       ├── seedBrands.js
│       ├── seedClients.js
│       ├── seedCycle.js
│       └── seedCSATResponses.js
├── CSAT_API_Collection.postman_collection.json
└── package.json
```

---

## 📊 Database Collections

| Collection | Documents | Description |
|------------|-----------|-------------|
| `departments` | 7 | Service departments |
| `sbus` | 20+ | Strategic Business Units |
| `sbu_history` | varies | SBU snapshots per cycle |
| `brands` | 150+ | Client brands |
| `brand_history` | varies | Brand snapshots per cycle |
| `clients` | 300+ | POC contacts |
| `client_history` | varies | Client snapshots per cycle |
| `cycles` | 6/year | Survey cycles |
| `csat_responses` | 200+ | Survey responses (Cycle 4 + 5) |

---

## 🚀 How to Run

### Seeding Data (Run in Order)

#### For Cycle 5:
```bash
node scripts/cycle5/seedSBUs.js
node scripts/cycle5/seedBrands.js
node scripts/cycle5/seedClients.js
node scripts/cycle5/seedCSATResponses.js
```

#### For Cycle 4:
```bash
node scripts/cycle4/seedCycle4BrandsAndClients.js
node scripts/cycle4/seedCycle4SBUs.js
node scripts/cycle4/seedCycle4CSATResponses.js
```

### Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Required Environment Variables
```env
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=8080
```

---

## 📝 Key Design Decisions

### 1. History ID Fields in CSATResponse
Each CSATResponse document stores both **main IDs** (for current/live reference) and **history IDs** (for historical snapshots):
- `brandId` + `brandHistoryId`
- `clientId` + `clientHistoryId`
- `sbuId` + `sbuHistoryId`

### 2. Automatic Historical Enrichment
When querying older cycle data, the `enrichWithHistoricalData()` function in `helper.js` automatically replaces populated entity data with their historical snapshots.

### 3. Department-Specific SBUs
SBUs are department-specific. Each department has its own SBU lead configurations, filtered by `departmentId`.

---

## ⚠️ Notes for Future Development

1. **ES Modules** - Project uses `"type": "module"` in package.json
2. **Path aliases** - Use `#config/*`, `#controllers/*` for imports
3. **Schemaless CSAT data** - `data` field in CSATResponse is Mixed type (each department has different metrics)
4. **History IDs are optional** - For current cycle, history IDs can be null
5. **Run seeding scripts in order** - Dependencies must exist before linking