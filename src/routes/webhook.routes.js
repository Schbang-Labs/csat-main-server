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
 *       1. **Brand**: Finds existing brand by name or creates new one
 *       2. **Client**: Finds existing client by phone + brand, or creates new POC
 *       3. **Cycle**: Uses the currently active cycle
 *       4. **Department**: Matches by department code
 *       5. **SBU**: Auto-assigned based on brand's service mapping
 *
 *       ## Response Handling
 *       - If no existing response: Creates new CSAT response (201)
 *       - If existing response for same brand + POC + cycle + department: Updates it (200)
 *
 *       ## Rating Scale
 *       All rating metrics use a 1-5 scale where:
 *       - 1 = Very Dissatisfied
 *       - 2 = Dissatisfied
 *       - 3 = Neutral
 *       - 4 = Satisfied
 *       - 5 = Very Satisfied
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CSATWebhookRequest'
 *           examples:
 *             fullPayload:
 *               summary: Complete CSAT payload
 *               value:
 *                 brandName: "Tata Motors"
 *                 clientName: "John Doe"
 *                 clientPhone: "9876543210"
 *                 departmentName: "solutions"
 *                 overallSatisfaction: 4
 *                 likelihoodToRecommend: 5
 *                 northStarMetrics: 4
 *                 seniorLeadershipInvolvement: 4
 *                 strategyExecution: 4
 *                 teamResponsiveness: 5
 *                 brandUnderstanding: 4
 *                 dataEffectiveness: 4
 *                 teamProactivity: 5
 *                 meetingBusinessGoals: 4
 *                 qualityOfDesignVideo: 4
 *                 qualityOfIdeas: 5
 *                 comment: "Great service overall! Very happy with the team."
 *             minimalPayload:
 *               summary: Minimal required payload
 *               value:
 *                 brandName: "Acme Corp"
 *                 clientName: "Jane Smith"
 *                 clientPhone: "8765432109"
 *                 departmentName: "media"
 *                 overallSatisfaction: 3
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
 *                   message: "Missing required field: brandName"
 *               invalidJson:
 *                 summary: Invalid JSON
 *                 value:
 *                   success: false
 *                   message: "Invalid JSON string in request body"
 *               noCycle:
 *                 summary: No active cycle
 *                 value:
 *                   success: false
 *                   message: "No active cycle found. Please create a cycle first."
 */
router.post('/csat', receiveCSATWebhook);

export default router;
