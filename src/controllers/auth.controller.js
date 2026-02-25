import * as AuthService from '../services/auth.service.js';
import logger from '#config/logger.js';
import { sanitizeForLogs } from '#utils/logging.util.js';
import {
  SESSION_COOKIE_NAME,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  invalidateSessionToken,
} from '../services/session.service.js';

const normalizeString = value => (typeof value === 'string' ? value.trim() : '');

const getRequestIpAddress = req => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

const sendAuthError = (req, res, error, fallbackMessage) => {
  const statusCode = error.statusCode || 500;
  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.path,
    statusCode,
    error: error.message,
    query: sanitizeForLogs(req.query),
    body: sanitizeForLogs(req.body),
  };

  if (statusCode >= 500) {
    logger.error('Auth request failed', {
      ...logPayload,
      stack: error.stack,
    });
  } else {
    logger.warn('Auth request failed', logPayload);
  }

  return res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? fallbackMessage : error.message,
    message: error.message,
  });
};

export const register = async (req, res) => {
  try {
    const name = normalizeString(req.body?.name);
    const email = normalizeString(req.body?.email);
    const password = normalizeString(req.body?.password);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'name and email are required',
      });
    }

    const user = await AuthService.registerWithEmailPassword({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to register user');
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeString(req.body?.email);
    const password = normalizeString(req.body?.password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'email and password are required',
      });
    }

    const user = await AuthService.loginWithEmailPassword({ email, password });

    const { rawToken } = await createSession({
      userId: user._id,
      ipAddress: getRequestIpAddress(req),
      userAgent: req.headers['user-agent'] || null,
    });

    setSessionCookie(res, rawToken);

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to login');
  }
};

export const googleLogin = async (req, res) => {
  try {
    const idToken = normalizeString(req.body?.idToken);

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'idToken is required',
      });
    }

    const user = await AuthService.loginWithGoogle({ idToken });

    const { rawToken } = await createSession({
      userId: user._id,
      ipAddress: getRequestIpAddress(req),
      userAgent: req.headers['user-agent'] || null,
    });

    setSessionCookie(res, rawToken);

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to login with Google');
  }
};

export const logout = async (req, res) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      await invalidateSessionToken(sessionToken);
    }

    clearSessionCookie(res);

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to logout');
  }
};

export const me = async (req, res) => {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    const userFromCookie = await AuthService.getCurrentUserBySessionToken(
      sessionToken
    );
    const user = userFromCookie || req.user || null;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Login required.',
      });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessScopes: Array.isArray(user.accessScopes) ? user.accessScopes : [],
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to fetch current user');
  }
};

export const getUserByEmail = async (req, res) => {
  try {
    logger.info('loggedInUser', {
      requestId: req.requestId,
      loggedInUser: sanitizeForLogs(req.user),
    });

    const email = normalizeString(req.query?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'email query parameter is required',
      });
    }

    const user = await AuthService.getUserByEmail(email);

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to fetch user by email');
  }
};

export const updateUserByEmail = async (req, res) => {
  try {
    logger.info('loggedInUser', {
      requestId: req.requestId,
      loggedInUser: sanitizeForLogs(req.user),
    });

    const email = normalizeString(req.body?.email);
    const role = req.body?.role;
    const hasAccessScopesField = Object.prototype.hasOwnProperty.call(
      req.body || {},
      'accessScopes'
    );
    const hasAccessScopeField = Object.prototype.hasOwnProperty.call(
      req.body || {},
      'accessScope'
    );

    if (hasAccessScopesField && hasAccessScopeField) {
      return res.status(400).json({
        success: false,
        error: 'Provide either accessScopes or accessScope, not both',
      });
    }

    const accessScopes = hasAccessScopesField
      ? req.body.accessScopes
      : hasAccessScopeField
        ? req.body.accessScope
        : undefined;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'email is required',
      });
    }

    const user = await AuthService.updateUserByEmail({
      email,
      role,
      accessScopes,
    });

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to update user');
  }
};

const CSAT_ALLOWED_ROLES = new Set(['admin', 'head_department']);

export const showCsat = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Login required.',
      });
    }

    const hasAccess = CSAT_ALLOWED_ROLES.has(user.role);

    return res.json({
      success: true,
      showCsat: hasAccess,
    });
  } catch (error) {
    return sendAuthError(req, res, error, 'Failed to check CSAT access');
  }
};

export default {
  register,
  login,
  googleLogin,
  logout,
  me,
  getUserByEmail,
  updateUserByEmail,
  showCsat,
};
