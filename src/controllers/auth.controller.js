import * as AuthService from '../services/auth.service.js';
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

const sendAuthError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || 500;
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

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'name, email and password are required',
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
    return sendAuthError(res, error, 'Failed to register user');
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

    const { rawToken, expiresAt } = await createSession({
      userId: user._id,
      ipAddress: getRequestIpAddress(req),
      userAgent: req.headers['user-agent'] || null,
    });

    setSessionCookie(res, rawToken);

    return res.json({
      success: true,
      data: {
        user,
        expiresAt,
      },
    });
  } catch (error) {
    return sendAuthError(res, error, 'Failed to login');
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

    const { rawToken, expiresAt } = await createSession({
      userId: user._id,
      ipAddress: getRequestIpAddress(req),
      userAgent: req.headers['user-agent'] || null,
    });

    setSessionCookie(res, rawToken);

    return res.json({
      success: true,
      data: {
        user,
        expiresAt,
      },
    });
  } catch (error) {
    return sendAuthError(res, error, 'Failed to login with Google');
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
    return sendAuthError(res, error, 'Failed to logout');
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
        error: 'Authentication required',
      });
    }

    return res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    return sendAuthError(res, error, 'Failed to fetch current user');
  }
};

export default {
  register,
  login,
  googleLogin,
  logout,
  me,
};
