/**
 * Webhook Routes
 * Routes for receiving webhooks from external services (Pabbly, etc.)
 */

import { Router } from 'express';
import { receiveCSATWebhook } from '../controllers/webhook/webhook.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/webhook/csat:
 *   post:
 *     summary: Receive CSAT data from external services
 *     description: |
 *       Receives CSAT survey data from external webhook sources like Pabbly.
 *
 *       ## Payload Handling
 *       This endpoint handles multiple payload formats:
 *       - **Direct JSON body**: Standard JSON payload
 *       - **JSON string payload**: Auto-parsed if body is a JSON string
 *       - **Nested data field**: Unwraps `data` field if it contains a JSON string
 *
 *       ## Matching Logic
 *       1. **Client**: Finds existing client by phone
 *       2. **Brand**: Uses brand attached to matched client
 *       3. **Cycle**: Uses the configured target cycle
 *       4. **Department**: Matches by department code
 *       5. **SBU**: Auto-assigned based on brand's service mapping
 *
 *       ## Response Handling
 *       - **Core form** (`service` absent): Creates or updates CSAT response for brand+client+cycle+department
 *       - **Service form** (`service` present): Updates existing core response by writing `data[serviceName]` and appending serviceId
 *
 *       ## Core Form Prerequisite
 *       Service-form submissions require an existing core response for the same client+department+cycle.
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CSATWebhookRequest'
 *           examples:
 *             corePayload:
 *               summary: Core form payload
 *               value:
 *                 clientPhone: "9876543210"
 *                 departmentName: "solutions"
 *                 data:
 *                   coreMetrics:
 *                     overallSatisfaction: 4
 *                     likelihoodToRecommend: 5
 *                   comment: "Great service overall!"
 *             servicePayload:
 *               summary: Service form payload
 *               value:
 *                 clientPhone: "9876543210"
 *                 departmentName: "solutions"
 *                 service: "Performance Marketing"
 *                 data:
 *                   coreMetrics:
 *                     overallSatisfaction: 5
 *                     likelihoodToRecommend: 5
 *                   comment: "Strong service delivery"
 *     responses:
 *       201:
 *         description: CSAT response created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "CSAT response created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                       enum: [created, updated]
 *                       example: "created"
 *                     response:
 *                       $ref: '#/components/schemas/CSATResponse'
 *                     brand:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isNew:
 *                           type: boolean
 *                     client:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isNew:
 *                           type: boolean
 *       200:
 *         description: CSAT response updated (existing response found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "CSAT response updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                       example: "updated"
 *       400:
 *         description: Invalid payload or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingField:
 *                 summary: Missing required field
 *                 value:
 *                   success: false
 *                   message: "clientPhone is required"
 *               invalidJson:
 *                 summary: Invalid JSON
 *                 value:
 *                   success: false
 *                   message: "Invalid JSON string in request body"
 *               missingCore:
 *                 summary: Service form before core
 *                 value:
 *                   success: false
 *                   message: "Core CSAT response not found for this client and department in current cycle"
 */
router.post('/csat', receiveCSATWebhook);

export default router;
