import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from '../services/session.service.js';

const sanitizeRequestUser = user => {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};

export const optionalSessionMiddleware = async (req, _res, next) => {
  if (req.clientType !== 'sbu') {
    req.user = null;
    return next();
  }

  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionToken) {
      req.user = null;
      return next();
    }

    const validated = await validateSessionToken(sessionToken);
    req.user = sanitizeRequestUser(validated?.user || null);
    return next();
  } catch (error) {
    return next(error);
  }
};

export default optionalSessionMiddleware;
