import crypto from 'crypto';
import { Session, User } from '../models/index.js';

export const SESSION_COOKIE_NAME = 'csat_session';

export const hashSessionToken = sessionToken =>
  crypto.createHash('sha256').update(sessionToken).digest('hex');

export const generateRawSessionToken = () =>
  crypto.randomBytes(32).toString('hex');

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
});

export const setSessionCookie = (res, sessionToken) => {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
};

export const clearSessionCookie = res => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
};

export const createSession = async ({ userId, ipAddress, userAgent }) => {
  const rawToken = generateRawSessionToken();
  const sessionTokenHash = hashSessionToken(rawToken);

  await Session.create({
    userId,
    sessionTokenHash,
    isValid: true,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  return { rawToken };
};

export const validateSessionToken = async sessionToken => {
  if (!sessionToken) return null;

  const sessionTokenHash = hashSessionToken(sessionToken);

  const session = await Session.findOne({
    sessionTokenHash,
    isValid: true,
  }).lean();

  if (!session) return null;

  const user = await User.findOne({
    _id: session.userId,
    isActive: true,
  }).lean();

  if (!user) {
    await Session.updateOne({ _id: session._id }, { $set: { isValid: false } });
    return null;
  }

  return { session, user };
};

export const invalidateSessionToken = async sessionToken => {
  if (!sessionToken) return { modifiedCount: 0 };

  const sessionTokenHash = hashSessionToken(sessionToken);
  return Session.updateOne(
    { sessionTokenHash, isValid: true },
    { $set: { isValid: false } }
  );
};

export default {
  SESSION_COOKIE_NAME,
  hashSessionToken,
  generateRawSessionToken,
  getSessionCookieOptions,
  setSessionCookie,
  clearSessionCookie,
  createSession,
  validateSessionToken,
  invalidateSessionToken,
};
