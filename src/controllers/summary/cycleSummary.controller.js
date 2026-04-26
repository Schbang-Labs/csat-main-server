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

const buildPersistenceOptions = ({
  cycleId,
  req,
  access,
  scopedSbuIds,
  generationMode,
}) => ({
  cycleId,
  generationMode,
  accessScope: {
    role: access.role,
    scopedSbuIds,
    allDepartmentIds: access.allDepartmentIds,
  },
  generatedBy: {
    userId: req.user?._id || null,
    email: req.user?.email || null,
  },
});

const buildSummaryPdfFilename = summaryRecord => {
  const cycleNumber = summaryRecord?.cycleInfo?.cycleNumber || 'na';
  const year = summaryRecord?.cycleInfo?.year || 'na';
  const summaryId = String(summaryRecord?._id || 'summary');
  return `csat_cycle_summary_${cycleNumber}_${year}_${summaryId}.pdf`;
};

const resolveRequestedUserEmail = req => {
  const headerEmail =
    typeof req.headers['x-user-email'] === 'string'
      ? req.headers['x-user-email'].trim().toLowerCase()
      : '';

  if (headerEmail) return headerEmail;

  const requestUserEmail =
    typeof req.user?.email === 'string' ? req.user.email.trim().toLowerCase() : '';

  return requestUserEmail || null;
};

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

      const streamedPayload = await CycleSummaryService.streamCycleSummary(
        cycleId,
        { sbuIds: scopedSbuIds },
        res
      );
      if (!streamedPayload || res.writableEnded) {
        return;
      }

      const summaryRecord = await CycleSummaryService.saveCycleSummaryRecord(
        streamedPayload,
        buildPersistenceOptions({
          cycleId,
          req,
          access,
          scopedSbuIds,
          generationMode: 'stream',
        })
      );

      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            summaryId: String(summaryRecord._id),
            brandsNeedingAttention: streamedPayload.brandsNeedingAttention,
            brandAggregation: streamedPayload.brandAggregation,
          })}\n\n`
        );
        res.end();
      }

      logger.info('[CycleSummary] stream:completed', {
        cycleId,
        summaryId: String(summaryRecord._id),
        durationMs: Date.now() - startTime,
      });
    } else {
      logger.info('[CycleSummary] generate:started', { cycleId });
      const generatedSummary = await CycleSummaryService.generateCycleSummary(cycleId, {
        sbuIds: scopedSbuIds,
      });
      const summaryRecord = await CycleSummaryService.saveCycleSummaryRecord(
        generatedSummary,
        buildPersistenceOptions({
          cycleId,
          req,
          access,
          scopedSbuIds,
          generationMode: 'sync',
        })
      );
      const data = CycleSummaryService.toSummaryResponse(summaryRecord);

      logger.info('[CycleSummary] generate:completed', {
        cycleId,
        summaryId: String(summaryRecord._id),
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

    if (stream && res.headersSent) {
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: error.message || 'Failed to generate cycle summary',
          })}\n\n`
        );
        res.end();
      }
      return;
    }

    if (res.headersSent) return;

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to generate cycle summary',
    });
  }
};

/**
 * GET /api/v1/dashboard/cycle-summary/:summaryId
 * Query params: export=true|false (default: false)
 */
export const getCycleSummaryById = async (req, res) => {
  const startTime = Date.now();
  const { summaryId } = req.params;
  const exportPdf = req.query.export === 'true';

  logger.info('[CycleSummary] fetchById:started', {
    summaryId,
    exportPdf,
    role: req.authz?.role || null,
    clientType: req.clientType || 'unknown',
    userEmail: req.user?.email || null,
  });

  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const summaryRecord = await CycleSummaryService.getStoredCycleSummary(summaryId);

    if (!summaryRecord) {
      return res.status(404).json({
        success: false,
        message: 'Cycle summary not found',
      });
    }

    const hasAccess = CycleSummaryService.canAccessStoredCycleSummary(summaryRecord, {
      role: access.role,
      scopedSbuIds,
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this resource.',
      });
    }

    if (exportPdf) {
      const pdfBuffer = await CycleSummaryService.buildCycleSummaryPdf(summaryRecord);
      const filename = buildSummaryPdfFilename(summaryRecord);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      logger.info('[CycleSummary] fetchById:exported', {
        summaryId,
        fileSize: pdfBuffer.length,
        durationMs: Date.now() - startTime,
      });

      return res.send(pdfBuffer);
    }

    const data = CycleSummaryService.toSummaryResponse(summaryRecord);

    logger.info('[CycleSummary] fetchById:completed', {
      summaryId,
      exportPdf,
      durationMs: Date.now() - startTime,
    });

    return res.json({ success: true, data });
  } catch (error) {
    logger.error('[CycleSummary] fetchById:failed', {
      summaryId,
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
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch cycle summary',
      });
    }
  }
};

/**
 * GET /api/v1/dashboard/cycle-summary/history
 * Header: x-user-email
 */
export const getCycleSummaryHistory = async (req, res) => {
  const startTime = Date.now();
  const requestedUserEmail = resolveRequestedUserEmail(req);

  logger.info('[CycleSummary] history:started', {
    requestedUserEmail,
    role: req.authz?.role || null,
    clientType: req.clientType || 'unknown',
    userEmail: req.user?.email || null,
  });

  try {
    if (!requestedUserEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required header: x-user-email',
      });
    }

    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);
    const callerEmail =
      typeof req.user?.email === 'string' ? req.user.email.trim().toLowerCase() : null;

    if (access.role !== 'admin' && callerEmail && callerEmail !== requestedUserEmail) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this resource.',
      });
    }

    const historyRecords = await CycleSummaryService.listStoredCycleSummariesByEmail(
      requestedUserEmail,
      {
        role: access.role,
        scopedSbuIds,
      }
    );

    const summaries = historyRecords.map(CycleSummaryService.toSummaryHistoryResponse);

    logger.info('[CycleSummary] history:completed', {
      requestedUserEmail,
      total: summaries.length,
      durationMs: Date.now() - startTime,
    });

    return res.json({
      success: true,
      data: {
        userEmail: requestedUserEmail,
        total: summaries.length,
        summaries,
      },
    });
  } catch (error) {
    logger.error('[CycleSummary] history:failed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      params: sanitizeForLogs(req.params),
      query: sanitizeForLogs(req.query),
      error: error.message,
      stack: error.stack,
      durationMs: Date.now() - startTime,
    });

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch cycle summary history',
    });
  }
};
