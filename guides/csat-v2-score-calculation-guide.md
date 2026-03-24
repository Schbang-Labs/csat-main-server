# CSAT V2 Score Calculation Guide

This document explains how CSAT averages and NPS scores are calculated when both **v1** (flat) and **v2** (service-keyed) response structures coexist.

---

## Table of Contents

1. [Data Structure Comparison](#1-data-structure-comparison)
2. [Version Detection](#2-version-detection)
3. [Score Calculation Rules (v1)](#3-score-calculation-rules-v1)
4. [Score Calculation Rules (v2)](#4-score-calculation-rules-v2)
5. [MongoDB Aggregation Strategy](#5-mongodb-aggregation-strategy)
6. [Worked Examples](#6-worked-examples)
7. [API Impact Matrix](#7-api-impact-matrix)
8. [Key Files Reference](#8-key-files-reference)

---

## 1. Data Structure Comparison

### V1 — Flat Structure (legacy)

Metrics live directly under `data`:

```json
{
  "version": "v1",
  "data": {
    "coreMetrics": {
      "overallSatisfaction": 4,
      "likelihoodToRecommend": 5,
      "northStarMetrics": 3,
      "seniorLeadershipInvolvement": 4,
      "strategyExecution": 4,
      "teamResponsiveness": 5,
      "brandUnderstanding": 4
    },
    "deliveryMetrics": {
      "dataEffectiveness": 4,
      "teamProactivity": 3,
      "meetingBusinessGoals": 4
    },
    "qualityEvaluation": {
      "qualityOfDesignVideo": 4,
      "qualityOfIdeas": 5
    }
  }
}
```

### V2 — Service-Keyed Structure (new)

Metrics are nested under dynamic service or department name keys:

```json
{
  "version": 2,
  "data": {
    "Performance Marketing": {
      "coreMetrics": { "overallSatisfaction": 5, "likelihoodToRecommend": 5 },
      "campaignExecution": 5,
      "reportingQuality": 4,
      "comment": "Great work",
      "createdAt": "2026-03-22T10:00:00.000Z"
    },
    "SEO": {
      "coreMetrics": { "overallSatisfaction": 4, "likelihoodToRecommend": 4 },
      "keywordGrowth": 5,
      "technicalFixes": 3,
      "comment": "Good progress",
      "createdAt": "2026-03-22T11:30:00.000Z"
    }
  }
}
```

**Department-level v2** (no service name): uses the department name as the key:

```json
{
  "version": 2,
  "data": {
    "solutions": {
      "coreMetrics": { "overallSatisfaction": 4, "likelihoodToRecommend": 5 },
      "campaignExecution": 4,
      "comment": "Good overall"
    }
  }
}
```

---

## 2. Version Detection

A response is treated as **v2** if:

1. `version` field equals `2` (number), `"2"` (string), or `"v2"` (string), **OR**
2. Heuristic: `data` has no root-level `coreMetrics` but contains nested objects with `coreMetrics`

Everything else is treated as **v1** (including responses with no version field).

**Source:** `src/services/dashboard/helper.js` → `isV2Response()`

---

## 3. Score Calculation Rules (v1)

Unchanged from the original guide. See [csat-average-nps-calculation-guide.md](./csat-average-nps-calculation-guide.md).

**Summary:**
- **CSAT** = average of all numeric values > 0 from `coreMetrics` (excluding NPS fields), `deliveryMetrics`, and `qualityEvaluation`
- **NPS** = `coreMetrics.likelihoodToRecommend` (fallback: `coreMetrics.workAgainLikelihood` for SMP)

---

## 4. Score Calculation Rules (v2)

### CSAT: Average-of-Averages

For each service key in `data`:

1. Collect all numeric values > 0 from:
   - `coreMetrics` (excluding `likelihoodToRecommend` and `workAgainLikelihood`)
   - `deliveryMetrics` (all fields)
   - `qualityEvaluation` (all fields)
   - Top-level numeric fields (e.g., `campaignExecution`, `keywordGrowth`)
   - **Excludes:** `comment`, `createdAt`, `filledAt`, `coreMetrics` (as object), `deliveryMetrics` (as object), `qualityEvaluation` (as object)
2. Compute per-service CSAT = average of those values

Then: **Overall CSAT = average of per-service CSAT scores**

This gives **equal weight to each service**, regardless of how many metrics it has.

### NPS: Average Across Services

1. For each service key, extract `coreMetrics.likelihoodToRecommend` (fallback: `coreMetrics.workAgainLikelihood`)
2. **Overall NPS = average of all service NPS values**

### Special Cases

| Scenario | Behavior |
|----------|----------|
| Single service key | Degenerates to same behavior as v1 |
| Department-keyed (no serviceName) | Department name is the key — same logic |
| Service with no metrics (only `comment`) | Skipped — does not contribute to CSAT or NPS |
| Empty `data` object | Returns `{ csatScore: 0, npsScore: 0, metricsCount: 0 }` |

**Source:** `src/services/dashboard/helper.js` → `calculateV2Scores()`, `extractMetricGroupScores()`

---

## 5. MongoDB Aggregation Strategy

### Problem

MongoDB aggregation pipelines previously used hardcoded paths:
- `$data.coreMetrics.overallSatisfaction` for CSAT
- `$data.coreMetrics.likelihoodToRecommend` for NPS

These paths don't work for v2 where metrics are nested under dynamic keys.

### Solution: Score Normalization Stages

A reusable set of `$addFields` pipeline stages is inserted **before** the `$group` stage:

```javascript
import { getScoreNormalizationStages } from './helper.js';

CSATResponse.aggregate([
  { $match: filter },
  ...getScoreNormalizationStages(),   // <-- adds _csatScore and _npsScore
  {
    $group: {
      _id: '$departmentId',
      avgSatisfaction: { $avg: '$_csatScore' },    // <-- use normalized fields
      avgNPS: { $avg: '$_npsScore' },
    },
  },
]);
```

### How It Works

The stages add two computed fields to each document:

| Field | v1 Value | v2 Value |
|-------|----------|----------|
| `_csatScore` | `data.coreMetrics.overallSatisfaction` (direct) | Average of `overallSatisfaction` across all service keys |
| `_npsScore` | `data.coreMetrics.likelihoodToRecommend` (with `workAgainLikelihood` fallback) | Average of `likelihoodToRecommend` across all service keys |

**v2 pipeline logic:**
1. `$objectToArray` converts `data` into `[{k: serviceName, v: serviceData}, ...]`
2. `$filter` excludes non-service keys (`servicesCovered`, `formVersion`, etc.)
3. `$map` extracts `overallSatisfaction` (or NPS) from each service entry
4. `$filter` removes null/zero values
5. `$avg` computes the average

**Source:** `src/services/dashboard/helper.js` → `getScoreNormalizationStages()`

> **Note:** The MongoDB aggregation pipeline uses `overallSatisfaction` only for CSAT (same as v1 Approach B). The full multi-metric CSAT average is only computed in application-level code (Approach A). This is the same distinction documented in the [original guide](./csat-average-nps-calculation-guide.md#7-mongodb-aggregation-pipelines-api-level).

---

## 6. Worked Examples

### Example 1: V2 Response with 2 Services

```json
{
  "version": 2,
  "data": {
    "Performance Marketing": {
      "coreMetrics": { "overallSatisfaction": 5, "likelihoodToRecommend": 5 },
      "campaignExecution": 4,
      "reportingQuality": 3
    },
    "SEO": {
      "coreMetrics": { "overallSatisfaction": 4, "likelihoodToRecommend": 3 },
      "keywordGrowth": 5,
      "technicalFixes": 3
    }
  }
}
```

**Per-Service CSAT:**

| Service | Metrics (excl NPS) | Service CSAT |
|---------|--------------------|-------------|
| Performance Marketing | overallSatisfaction=5, campaignExecution=4, reportingQuality=3 | (5+4+3)/3 = **4.00** |
| SEO | overallSatisfaction=4, keywordGrowth=5, technicalFixes=3 | (4+5+3)/3 = **4.00** |

**Overall CSAT** = avg(4.00, 4.00) = **4.00**

**NPS:**

| Service | likelihoodToRecommend |
|---------|-----------------------|
| Performance Marketing | 5 |
| SEO | 3 |

**Overall NPS** = avg(5, 3) = **4.00**

**Result:** `{ csatScore: 4.00, npsScore: 4.00 }`

---

### Example 2: V2 Response with 1 Service (Department-Keyed)

```json
{
  "version": 2,
  "data": {
    "solutions": {
      "coreMetrics": { "overallSatisfaction": 3, "likelihoodToRecommend": 4 },
      "campaignExecution": 4
    }
  }
}
```

Only one service key → works like v1:

- CSAT = avg(3, 4) = **3.50**
- NPS = **4**

**Result:** `{ csatScore: 3.50, npsScore: 4.00 }`

---

### Example 3: Mixed v1 + v2 Aggregate

Given 3 responses in a department:

| Response | Version | CSAT Score | NPS Score |
|----------|---------|-----------|-----------|
| R1 (v1) | v1 | 4.00 | 5 |
| R2 (v2, 2 services) | 2 | 4.00 | 4.00 |
| R3 (v2, 1 service) | 2 | 3.50 | 4.00 |

**Application-Level Aggregate (Approach A):**
```
avgCSAT = (4.00 + 4.00 + 3.50) / 3 = 3.83
avgNPS  = (5 + 4.00 + 4.00) / 3 = 4.33
```

**MongoDB Aggregation (Approach B):**
Normalization stages compute `_csatScore` per document:
- R1: `overallSatisfaction` = 4 (direct v1 path)
- R2: avg of overallSatisfaction across services = avg(5, 4) = 4.5
- R3: overallSatisfaction from single service = 3

```
avgCSAT = (4 + 4.5 + 3) / 3 = 3.83
```

> **Note:** Approach A (multi-metric) and Approach B (overallSatisfaction only) may produce different values — this is by design, same as v1.

---

### Example 4: V2 with Uneven Service Metrics

```json
{
  "version": 2,
  "data": {
    "Performance Marketing": {
      "coreMetrics": { "overallSatisfaction": 5, "likelihoodToRecommend": 5 },
      "campaignExecution": 4,
      "reportingQuality": 3,
      "budgetUtilization": 4
    },
    "Social Media": {
      "coreMetrics": { "overallSatisfaction": 3, "likelihoodToRecommend": 2 }
    }
  }
}
```

**Per-Service CSAT (average-of-averages):**

| Service | Metrics | Service CSAT |
|---------|---------|-------------|
| Performance Marketing | 5, 4, 3, 4 | (5+4+3+4)/4 = **4.00** |
| Social Media | 3 | 3/1 = **3.00** |

**Overall CSAT** = avg(4.00, 3.00) = **3.50**

> With "pool all" approach this would have been: (5+4+3+4+3)/5 = 3.80. The average-of-averages gives equal weight to each service.

---

## 7. API Impact Matrix

All APIs handle both v1 and v2 transparently. No API changes are needed from the consumer side.

### Application-Level APIs (Approach A)

| Endpoint | What Changed |
|----------|-------------|
| `/filter/department/:departmentId` | `calculateResponseScores` now detects version and handles v2 |
| `/filter/brand/:brandId` | Same |
| `/filter/cycle/:cycleId` | Same |
| `/filter/year/:year` | Same |
| `/filter/sbu/:sbuId` | Same |
| `/department/summary` | `calculateResponseScores` call now passes `version`; query selects `version` field |

### MongoDB Aggregation APIs (Approach B)

| Endpoint | What Changed |
|----------|-------------|
| `/stats` | Pipeline uses `getScoreNormalizationStages()` + `$_csatScore` / `$_npsScore` |
| `/aggregate/departments` | Same |
| `/aggregate/brands` | Same |
| `/aggregate/sbus` | Same |
| `/aggregate/cycles` | Same |

### Inline Data Access (Detail Views)

| Location | What Changed |
|----------|-------------|
| `globalSearch` response formatting | Uses `extractQuickScores(resp)` instead of `resp.data?.coreMetrics?.overallSatisfaction` |
| Department detail table | Same |
| SBU detail table | Same |

---

## 8. Key Files Reference

| File | Role |
|------|------|
| `src/services/dashboard/helper.js` | Core score calculation logic: `isV2Response`, `calculateResponseScores`, `extractQuickScores`, `getScoreNormalizationStages` |
| `src/services/dashboard/dashboard.service.js` | All dashboard APIs — uses helper functions and normalization stages |
| `src/models/csatResponse.model.js` | Model statics (`getCycleStats`, `getDepartmentStats`, `getSBUStats`) — uses normalization stages via dynamic import |
| `src/services/webhook/csat.service.js` | Webhook handler — writes v2 data with `version: 2` |

### Key Functions

| Function | Purpose |
|----------|---------|
| `isV2Response(data, version)` | Detects v2 structure |
| `calculateResponseScores(data, version)` | Returns `{ csatScore, npsScore, metricsCount }` for both v1 and v2 |
| `extractQuickScores(response)` | Returns `{ score, nps }` for inline display — handles both versions |
| `getScoreNormalizationStages()` | Returns MongoDB `$addFields` stages that add `_csatScore` and `_npsScore` |
| `calculateV2Scores(data)` | Internal — computes v2 average-of-averages CSAT and averaged NPS |
| `extractMetricGroupScores(obj)` | Internal — extracts scores from a metric group (reused by both v1 and v2) |
