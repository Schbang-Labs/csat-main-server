/**
 * Cycle Summary Controller
 * Handles requests for AI-generated CSAT cycle summaries.
 */

import * as CycleSummaryService from '../../services/summary/cycleSummary.service.js';
import logger from '#config/logger.js';
import { sanitizeForLogs } from '#utils/logging.util.js';

/**
 * Extract access context from the authenticated request.
 * Mirrors the pattern in dashboard.controller.js.
 */
const getAccessContext = req => {
  const rawSbuIds = Array.isArray(req.authz?.allowedResourceIds?.sbu)
    ? req.authz.allowedResourceIds.sbu
    : [];

  const rawDepartmentIds = Array.isArray(req.authz?.allowedResourceIds?.department)
    ? req.authz.allowedResourceIds.department
    : [];

  const role = req.authz?.role || null;
  const roleScopedSbuIds = role === 'sbu' ? rawSbuIds : [];

  return {
    role,
    sbuIds: roleScopedSbuIds,
    allSbuIds: rawSbuIds,
    allDepartmentIds: rawDepartmentIds,
  };
};

/**
 * Resolve scoped SBU IDs based on role.
 * head_department users see all SBUs under their departments.
 * sbu users see only their directly assigned SBUs.
 * admin users see everything (empty array = no filter).
 */
const resolveScopedSbuIds = access =>
  access.role === 'head_department' ? access.allSbuIds : access.sbuIds;

/**
 * GET /api/v1/dashboard/cycle/:cycleId/summary
 * Query params: stream=true|false (default: false)
 */
export const getCycleSummary = async (req, res) => {
  const startTime = Date.now();
  const { cycleId } = req.params;
  const stream = req.query.stream === 'true';

  logger.info('[CycleSummary] request:started', {
    cycleId,
    stream,
    role: req.authz?.role || null,
    clientType: req.clientType || 'unknown',
    userEmail: req.user?.email || null,
  });

  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    logger.info('[CycleSummary] auth:resolved', {
      cycleId,
      role: access.role,
      scopedSbuIds: scopedSbuIds.length,
      allSbuIds: access.allSbuIds.length,
      allDepartmentIds: access.allDepartmentIds.length,
    });

    if (!cycleId) {
      logger.warn('[CycleSummary] request:failed — missing cycleId');
      return res
        .status(400)
        .json({ success: false, message: 'Missing required parameter: cycleId' });
    }

    if (stream) {
      logger.info('[CycleSummary] stream:started', { cycleId });
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      await CycleSummaryService.streamCycleSummary(
        cycleId,
        { sbuIds: scopedSbuIds },
        res
      );
      logger.info('[CycleSummary] stream:completed', {
        cycleId,
        durationMs: Date.now() - startTime,
      });
    } else {
      logger.info('[CycleSummary] generate:started', { cycleId });
      const data = await CycleSummaryService.generateCycleSummary(cycleId, {
        sbuIds: scopedSbuIds,
      });
      logger.info('[CycleSummary] generate:completed', {
        cycleId,
        hasSummary: !!data.summary,
        summaryLength: data.summary?.length || 0,
        brandsNeedingAttention: data.brandsNeedingAttention?.length || 0,
        brandAggregationCount: data.brandAggregation?.length || 0,
        durationMs: Date.now() - startTime,
      });
      res.json({ success: true, data });
    }

    logger.info('[CycleSummary] request:completed', {
      cycleId,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('[CycleSummary] request:failed', {
      cycleId,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      params: sanitizeForLogs(req.params),
      query: sanitizeForLogs(req.query),
      error: error.message,
      stack: error.stack,
      durationMs: Date.now() - startTime,
    });

    if (!res.headersSent) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to generate cycle summary',
      });
    }
  }
};
