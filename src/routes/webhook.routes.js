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
 *       3. **Cycle**: Uses the current active cycle
 *       4. **Department**: Matches by department code
 *       5. **SBU**: Auto-assigned based on brand's service mapping
 *
 *       ## Response Handling
 *       - **Service payload required** (`serviceName`): Webhook always upserts by client+department+active cycle
 *       - If no response exists, creates a new response with `data[serviceName] = payload.data`
 *       - If response exists, updates/overwrites `data[serviceName]` and dedupes serviceId in `services[]`
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CSATWebhookRequest'
 *           examples:
 *             firstServicePayload:
 *               summary: First service payload (creates response)
 *               value:
 *                 clientPhone: "9876543210"
 *                 departmentName: "solutions"
 *                 serviceName: "Performance Marketing"
 *                 data:
 *                   coreMetrics:
 *                     overallSatisfaction: 4
 *                     likelihoodToRecommend: 5
 *                   comment: "Great service overall!"
 *             secondServicePayload:
 *               summary: Second service payload (updates same response)
 *               value:
 *                 clientPhone: "9876543210"
 *                 departmentName: "solutions"
 *                 serviceName: "SEO"
 *                 data:
 *                   coreMetrics:
 *                     overallSatisfaction: 4
 *                     likelihoodToRecommend: 4
 *                   comment: "Strong SEO delivery"
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
 *               missingServiceName:
 *                 summary: Missing required serviceName
 *                 value:
 *                   success: false
 *                   message: "serviceName is required"
 *               missingActiveCycle:
 *                 summary: No active cycle configured
 *                 value:
 *                   success: false
 *                   message: "No active cycle found"
 */
router.post('/csat', receiveCSATWebhook);

export default router;
