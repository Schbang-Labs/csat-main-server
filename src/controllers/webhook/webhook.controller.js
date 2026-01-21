/**
 * Webhook Controller
 * Handles incoming webhooks from external services (e.g., Pabbly)
 */

import { createCSATResponse } from '../../services/webhook/csat.service.js';

/**
 * POST /api/v1/webhook/csat
 * Receive CSAT data from Pabbly and create CSATResponse
 *
 * Body:
 * {
 *   brandName: "Brand Name",
 *   clientName: "Client POC Name",
 *   clientPhone: "9876543210",
 *   departmentName: "solutions",
 *   overallSatisfaction: 4,
 *   likelihoodToRecommend: 4,
 *   northStarMetrics: 4,
 *   seniorLeadershipInvolvement: 4,
 *   strategyExecution: 4,
 *   teamResponsiveness: 4,
 *   brandUnderstanding: 4,
 *   dataEffectiveness: 4,
 *   teamProactivity: 4,
 *   meetingBusinessGoals: 4,
 *   qualityOfDesignVideo: 4,
 *   qualityOfIdeas: 4,
 *   comment: "Optional feedback"
 * }
 */
export const receiveCSATWebhook = async (req, res) => {
  try {
    console.log('📥 Received CSAT webhook');
    console.log('📥 Raw body type:', typeof req.body);
    console.log('📥 Raw body:', JSON.stringify(req.body, null, 2));

    let payload = req.body;

    // Handle case where Pabbly sends JSON as a string
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
        console.log(
          '📥 Parsed string payload:',
          JSON.stringify(payload, null, 2)
        );
      } catch {
        throw new Error('Invalid JSON string in request body');
      }
    }

    // Handle case where the entire body is wrapped in an extra layer
    // e.g., { "data": "{...actual json string...}" }
    if (payload.data && typeof payload.data === 'string') {
      try {
        const innerData = JSON.parse(payload.data);
        payload = { ...payload, ...innerData };
        delete payload.data; // Remove the string version
        if (innerData.data) {
          payload.data = innerData.data; // Keep the actual data object
        }
        console.log(
          '📥 Unwrapped nested payload:',
          JSON.stringify(payload, null, 2)
        );
      } catch {
        // data is not a JSON string, leave it as is
      }
    }

    const result = await createCSATResponse(payload);

    res.status(result.action === 'created' ? 201 : 200).json({
      success: true,
      message: `CSAT response ${result.action} successfully`,
      data: result,
    });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  receiveCSATWebhook,
};
