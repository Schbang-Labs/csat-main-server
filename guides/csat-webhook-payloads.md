# CSAT Webhook Payload Documentation

## Endpoint

```
POST /api/v1/csat
Content-Type: application/json
```

## Payload Fields

| Field            | Type   | Required | Description                                                                 |
| ---------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `clientPhone`    | string | Yes      | POC phone number. Auto-strips `+91`, `91`, `0` prefixes                     |
| `departmentName` | string | Yes      | One of: `solutions`, `media`, `tech`, `seo`, `martech`, `fluence`, `smp`    |
| `serviceName`    | string | No       | Service name under the department. If provided, triggers service-based flow |
| `data`           | object | Yes      | The form response payload containing metrics and comment                    |

---

## 1. Service-Based Form (with `serviceName`)

When `serviceName` is provided:

- Data is stored under `data[serviceName]` key in MongoDB
- Service ObjectId is added to the `services[]` array
- Multiple service submissions for the same client + department + cycle get **merged** into one response document
- Version is set to `2`

### Example Payload

```json
{
  "clientPhone": "8999431754",
  "departmentName": "tech",
  "serviceName": "Development",
  "data": {
    "coreMetrics": {
      "overallSatisfaction": 4,
      "likelihoodToRecommend": 4,
      "teamResponsiveness": 5,
      "understandingOfBrandAndBusiness": 4,
      "proactiveness": 4,
      "timelyExecution": 3
    },
    "developmentMetrics": {
      "buildQuality": 4,
      "bugFreeExecution": 3,
      "performance": 4,
      "crossDeviceConsistency": 4,
      "technicalRecommendationQuality": 5
    },
    "comment": "Development team showed strong technical expertise."
  }
}
```

### Second Service Submission (same client + department + cycle)

```json
{
  "clientPhone": "8999431754",
  "departmentName": "tech",
  "serviceName": "Design",
  "data": {
    "coreMetrics": {
      "overallSatisfaction": 5,
      "likelihoodToRecommend": 5,
      "teamResponsiveness": 4,
      "understandingOfBrandAndBusiness": 4,
      "proactiveness": 5,
      "timelyExecution": 4
    },
    "designMetrics": {
      "visualQuality": 5,
      "outputExpectation": 4,
      "problemSolving": 4,
      "clarityAndUsability": 5,
      "feedbackIncorporation": 4
    },
    "comment": "Design quality was excellent across all deliverables."
  }
}
```

### Stored Document in MongoDB (after both submissions)

```json
{
  "_id": "ObjectId(...)",
  "brandId": "ObjectId(...)",
  "clientId": "ObjectId(...)",
  "cycleId": "ObjectId(...)",
  "departmentId": "ObjectId(...)",
  "sbuId": null,
  "services": ["ObjectId(Development)", "ObjectId(Design)"],
  "version": 2,
  "isValid": true,
  "submittedAt": "2026-03-31T...",
  "data": {
    "Development": {
      "coreMetrics": {
        "overallSatisfaction": 4,
        "likelihoodToRecommend": 4,
        "teamResponsiveness": 5,
        "understandingOfBrandAndBusiness": 4,
        "proactiveness": 4,
        "timelyExecution": 3
      },
      "developmentMetrics": {
        "buildQuality": 4,
        "bugFreeExecution": 3,
        "performance": 4,
        "crossDeviceConsistency": 4,
        "technicalRecommendationQuality": 5
      },
      "comment": "Development team showed strong technical expertise."
    },
    "Design": {
      "coreMetrics": {
        "overallSatisfaction": 5,
        "likelihoodToRecommend": 5,
        "teamResponsiveness": 4,
        "understandingOfBrandAndBusiness": 4,
        "proactiveness": 5,
        "timelyExecution": 4
      },
      "designMetrics": {
        "visualQuality": 5,
        "outputExpectation": 4,
        "problemSolving": 4,
        "clarityAndUsability": 5,
        "feedbackIncorporation": 4
      },
      "comment": "Design quality was excellent across all deliverables."
    }
  }
}
```

---

## 2. Non-Service-Based Form (without `serviceName`)

When `serviceName` is **not** provided:

- Data is stored under `data[departmentName]` key in MongoDB
- `services[]` array remains **empty**
- Version is set to `2`

### Example Payload

```json
{
  "clientPhone": "8999431754",
  "departmentName": "media",
  "data": {
    "coreMetrics": {
      "overallSatisfaction": 4,
      "likelihoodToRecommend": 5,
      "teamResponsiveness": 4,
      "understandingOfBrandAndBusiness": 4,
      "proactiveness": 3,
      "timelyExecution": 4
    },
    "deliveryMetrics": {
      "dataEffectiveness": 4,
      "teamProactivity": 3,
      "meetingBusinessGoals": 4
    },
    "qualityEvaluation": {
      "qualityOfDesignVideo": 4,
      "qualityOfIdeas": 5
    },
    "comment": "Good overall media execution with strong creative quality."
  }
}
```

### Stored Document in MongoDB

```json
{
  "_id": "ObjectId(...)",
  "brandId": "ObjectId(...)",
  "clientId": "ObjectId(...)",
  "cycleId": "ObjectId(...)",
  "departmentId": "ObjectId(...)",
  "sbuId": null,
  "services": [],
  "version": 2,
  "isValid": true,
  "submittedAt": "2026-03-31T...",
  "data": {
    "media": {
      "coreMetrics": {
        "overallSatisfaction": 4,
        "likelihoodToRecommend": 5,
        "teamResponsiveness": 4,
        "understandingOfBrandAndBusiness": 4,
        "proactiveness": 3,
        "timelyExecution": 4
      },
      "deliveryMetrics": {
        "dataEffectiveness": 4,
        "teamProactivity": 3,
        "meetingBusinessGoals": 4
      },
      "qualityEvaluation": {
        "qualityOfDesignVideo": 4,
        "qualityOfIdeas": 5
      },
      "comment": "Good overall media execution with strong creative quality."
    }
  }
}
```

---

## Upsert Behavior

Responses are matched by **client + department + cycle**:

```
CSATResponse.findOne({ clientId, departmentId, cycleId })
```

- **First submission**: Creates a new document
- **Subsequent submissions** (same client + dept + cycle): Updates the existing document
  - Service-based: Adds/overwrites `data[serviceName]`, deduplicates `services[]`
  - Non-service-based: Overwrites `data[departmentName]`

---

## Score Calculation

| Score | Calculation |
| ----- | ----------- |
| **CSAT** | Average of ALL numeric metrics across all metric groups (`coreMetrics`, `deliveryMetrics`, `designMetrics`, `developmentMetrics`, `qualityEvaluation`, top-level numerics) **excluding** `likelihoodToRecommend` and `workAgainLikelihood`. For multi-service responses: per-service average first, then average across services. |
| **NPS** | Value of `likelihoodToRecommend` (fallback: `workAgainLikelihood`) from `coreMetrics`. For multi-service responses: averaged across services. |
