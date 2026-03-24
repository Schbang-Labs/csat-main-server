/**
 * Webhook Controller
 * Handles incoming webhooks from external services (e.g., Pabbly)
 */

import logger from '#config/logger.js';
import { sanitizeForLogs } from '#utils/logging.util.js';
import { createCSATResponse } from '../../services/webhook/csat.service.js';

/**
 * POST /api/v1/webhook/csat
 * Receive CSAT data from Pabbly and create CSATResponse
 *
 * Body:
 * {
 *   clientPhone: "9876543210",
 *   departmentName: "solutions",
 *   serviceName: "Performance Marketing", // required
 *   data: {
 *     coreMetrics: {
 *       overallSatisfaction: 4,
 *       likelihoodToRecommend: 4
 *     },
 *     comment: "Optional feedback"
 *   }
 * }
 */
export const receiveCSATWebhook = async (req, res) => {
  try {
    logger.info('Received CSAT webhook payload', {
      requestId: req.requestId,
      bodyType: typeof req.body,
      body: sanitizeForLogs(req.body),
    });

    let payload = req.body;

    // Handle case where Pabbly sends JSON as a string
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
        logger.info('Parsed webhook payload from string', {
          requestId: req.requestId,
          payload: sanitizeForLogs(payload),
        });
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
        logger.info('Unwrapped nested webhook payload', {
          requestId: req.requestId,
          payload: sanitizeForLogs(payload),
        });
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
    logger.error('Webhook processing failed', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
      payload: sanitizeForLogs(req.body),
    });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  receiveCSATWebhook,
};
