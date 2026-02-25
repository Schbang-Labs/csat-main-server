/**
 * Swagger/OpenAPI Configuration
 * Generates API documentation from JSDoc comments
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CSAT Main Server API',
      version: '1.0.0',
      description: `
## CSAT Dashboard API Documentation

Comprehensive API for managing CSAT (Customer Satisfaction) survey data, 
including dashboard analytics, admin management, and webhook integrations.

### 🚀 Features
- 📊 **Dashboard**: Filter, aggregate, and analyze CSAT responses
- 🔧 **Admin**: Manage SBUs, Brands, Clients, and Cycles with history tracking
- 🔗 **Webhooks**: Receive external CSAT submissions from Pabbly
- 📥 **CSV Export**: Add \`?export=csv\` to filter endpoints to download data

### 🔐 Authentication
Currently all endpoints are public. Authentication will be added in future versions.

### 📈 Rate Limiting
No rate limiting is currently enforced.

### 📋 Departments
Valid department codes: \`solutions\`, \`media\`, \`tech\`, \`seo\`, \`martech\`, \`fluence\`, \`smp\`
      `,
      contact: {
        name: 'Schbang Tech Team',
        email: 'tech@schbang.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.csat.schbang.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'System health and status endpoints',
      },
      {
        name: 'Dashboard - Filters',
        description: 'Get available filter options for dashboard',
      },
      {
        name: 'Dashboard - Filter By Entity',
        description: 'Filter CSAT responses by department, brand, cycle, year, or SBU. Supports CSV export.',
      },
      {
        name: 'Dashboard - Aggregations',
        description: 'Aggregated statistics and comparisons across entities',
      },
      {
        name: 'Dashboard - Detail Views',
        description: 'Detailed views for departments, SBUs, and individual responses',
      },
      {
        name: 'Dashboard - Coverage',
        description: 'Brand and POC coverage tracking endpoints',
      },
      {
        name: 'Admin - SBU',
        description: 'Strategic Business Unit (SBU/POD) management with history tracking',
      },
      {
        name: 'Admin - Brand',
        description: 'Brand management with service mappings',
      },
      {
        name: 'Admin - Client',
        description: 'Client/POC (Point of Contact) management',
      },
      {
        name: 'Admin - Cycle',
        description: 'CSAT cycle management and finalization',
      },
      {
        name: 'Webhook',
        description: 'External webhook integrations for receiving CSAT data',
      },
    ],
  },
  apis: [
    './src/docs/swagger/components/*.js',
    './src/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };

export default {
  swaggerSpec,
  swaggerUi,
};
