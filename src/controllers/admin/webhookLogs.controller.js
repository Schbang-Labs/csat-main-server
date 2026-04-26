/**
 * Webhook Logs Controller
 * Admin endpoints for querying CSAT response processing logs
 */

import { CSATResponseLog } from '../../models/index.js';
import mongoose from 'mongoose';

/**
 * GET /api/v1/admin/webhook-logs
 * List logs with filters and pagination
 *
 * Query params:
 *   status       - 'success' | 'failure'
 *   failedAtStep - enum value (e.g., 'find_client', 'validate_payload')
 *   clientPhone  - partial phone match
 *   brandId      - ObjectId
 *   departmentId - ObjectId
 *   from         - ISO date string (createdAt >= from)
 *   to           - ISO date string (createdAt <= to)
 *   page         - page number (default: 1)
 *   limit        - items per page (default: 50)
 */
export const getWebhookLogs = async (req, res) => {
  try {
    const {
      status,
      failedAtStep,
      clientPhone,
      brandId,
      departmentId,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (failedAtStep) filter.failedAtStep = failedAtStep;
    if (clientPhone) {
      filter.clientPhone = { $regex: clientPhone, $options: 'i' };
    }
    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
      filter.brandId = brandId;
    }
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      filter.departmentId = departmentId;
    }
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [logs, total] = await Promise.all([
      CSATResponseLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      CSATResponseLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/admin/webhook-logs/stats
 * Aggregate failure counts by step
 *
 * Query params:
 *   from - ISO date string
 *   to   - ISO date string
 */
export const getWebhookLogStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    const matchStage = {};
    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from);
      if (to) matchStage.createdAt.$lte = new Date(to);
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $group: {
          _id: { status: '$status', failedAtStep: '$failedAtStep' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }
    );

    const results = await CSATResponseLog.aggregate(pipeline);

    let totalSuccess = 0;
    let totalFailure = 0;
    const failuresByStep = {};

    for (const item of results) {
      if (item._id.status === 'success') {
        totalSuccess += item.count;
      } else {
        totalFailure += item.count;
        const step = item._id.failedAtStep || 'unknown';
        failuresByStep[step] = (failuresByStep[step] || 0) + item.count;
      }
    }

    const total = totalSuccess + totalFailure;

    res.json({
      success: true,
      data: {
        total,
        totalSuccess,
        totalFailure,
        successRate: total > 0 ? +(totalSuccess / total).toFixed(4) : 0,
        failuresByStep,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/admin/webhook-logs/phone/:phone
 * Get all logs for a specific phone number
 */
export const getWebhookLogsByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = { clientPhone: { $regex: phone, $options: 'i' } };

    const [logs, total] = await Promise.all([
      CSATResponseLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      CSATResponseLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/v1/admin/webhook-logs/:id
 * Get a single log by ID
 */
export const getWebhookLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid log ID' });
    }

    const log = await CSATResponseLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getWebhookLogs,
  getWebhookLogStats,
  getWebhookLogsByPhone,
  getWebhookLogById,
};
