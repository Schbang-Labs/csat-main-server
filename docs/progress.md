# CSAT Server - Progress Document

> **Last Updated:** 2026-01-06  
> **Purpose:** Track development progress so new agents/developers can pick up from where we left off.

---

## 📋 Project Overview

The **CSAT Server** is a fresh Node.js/Express backend service for handling customer satisfaction data processing. It was bootstrapped by copying the NSM Server infrastructure and then cleaning out all NSM-specific code.

---

## ✅ Completed Steps

### 1. Initial Setup (2026-01-06)
- **Copied nsm-server codebase** as the foundation for csat-server
- **Removed all NSM-related code and branding:**
  - `package.json`:
    - Renamed package from `nsm-backend-server` → `csat-server`
    - Updated description to "CSAT Server - Production-grade API for customer satisfaction data processing"
    - Updated repository URLs from `nsm-server.git` → `csat-server.git`
  - `src/server.js`:
    - Updated startup log message: "NSM Backend API is ready!" → "CSAT Server is ready!"
  - `src/app.js`:
    - Updated health endpoint service name: `'NSM Backend API'` → `'CSAT Server'`
    - Updated root endpoint message: `'NSM Backend API'` → `'CSAT Server'`

---

## 📁 Current Project Structure

```
csat-server/
├── src/
│   ├── app.js              # Express app setup, middleware, routes
│   ├── server.js           # Server bootstrap, DB connection, startup
│   ├── config/             # Configuration (database, logger, sprout)
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Auth, rate limiting, error handling
│   ├── models/             # Mongoose models
│   ├── routes/             # API route definitions
│   ├── services/           # Service layer
│   ├── utils/              # Utility functions
│   └── validations/        # Input validation schemas
├── docs/
├── postman/                # Postman collection for testing
├── scripts/
├── tests/
├── package.json
└── .env                    # Environment variables (not committed)
```

---

## 🔧 Infrastructure Inherited from NSM Server

The server has the following pre-built infrastructure ready to use:

| Component                     | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| **Express 5.x**               | Web framework                                              |
| **MongoDB + Mongoose**        | Database with connection management                        |
| **JWT Authentication**        | Token-based auth                                           |
| **Helmet**                    | Security headers                                           |
| **CORS**                      | Cross-origin resource sharing (supports multiple origins)  |
| **Rate Limiting**             | Request throttling via `express-rate-limit`                |
| **Winston Logger**            | Structured logging                                         |
| **Morgan**                    | HTTP request logging                                       |
| **Joi/Zod**                   | Schema validation                                          |
| **node-cron**                 | Scheduled job support                                      |
| **Sprout Social Integration** | Social media data sync (may need review for CSAT use case) |

---

## ⚠️ Current State & Next Steps

### Server is at a "Fresh Start"
- All NSM branding has been removed
- The infrastructure is intact and ready for CSAT-specific development
- No CSAT-specific business logic has been implemented yet

### Recommended Next Steps
1. **Define CSAT requirements** - What data models, endpoints, and features are needed?
2. **Review Sprout Social integration** - Determine if this is needed for CSAT or should be removed
3. **Create CSAT-specific models** - Customer feedback, surveys, ratings, etc.
4. **Build CSAT API endpoints** - CRUD operations for satisfaction data
5. **Update environment variables** - Configure `.env` for CSAT-specific needs

---

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Required Environment Variables
```env
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=8080  # Optional, defaults to 8080
FRONTEND_URL=<allowed-origins>  # Can be JSON array or single URL
```

---

## 🐛 Current Issues / Blockers

**None at this time** - Server is in a clean state ready for CSAT development.

---

## 📝 Notes for Future Agents

1. The server uses ES Modules (`"type": "module"` in package.json)
2. Path aliases are configured (e.g., `#config/*`, `#controllers/*`) - use these for imports
3. The codebase follows ESLint + Prettier formatting standards
4. Database sync happens automatically on server start
5. Sprout Social integration initializes on startup - this may need to be reviewed/removed if not relevant to CSAT
