import { User } from '../models/index.js';
import logger from '#config/logger.js';
import { sanitizeForLogs } from '#utils/logging.util.js';

const ACCESS_ROLES = new Set(['admin', 'sbu', 'head_department']);

const normalizeEmail = value =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const getShowCsatAccess = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'email is required',
      });
    }

    const user = await User.findOne({ email }).select('role').lean();
    const access = ACCESS_ROLES.has(user?.role);

    return res.status(200).json({
      success: true,
      access,
    });
  } catch (error) {
    logger.error('Failed to evaluate /show-csat access', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      body: sanitizeForLogs(req.body),
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate access',
    });
  }
};

export default {
  getShowCsatAccess,
};
