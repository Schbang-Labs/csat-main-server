import crypto from 'crypto';
import { Session, User } from '../models/index.js';

export const SESSION_COOKIE_NAME = 'csat_session';

const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export const hashSessionToken = sessionToken =>
  crypto.createHash('sha256').update(sessionToken).digest('hex');

export const generateRawSessionToken = () =>
  crypto.randomBytes(32).toString('hex');

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: SESSION_DURATION_MS,
  path: '/',
});

export const setSessionCookie = (res, sessionToken) => {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
};

export const clearSessionCookie = res => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  });
};

export const createSession = async ({ userId, ipAddress, userAgent }) => {
  const rawToken = generateRawSessionToken();
  const sessionTokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await Session.create({
    userId,
    sessionTokenHash,
    expiresAt,
    isValid: true,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  return {
    rawToken,
    expiresAt,
  };
};

export const validateSessionToken = async sessionToken => {
  if (!sessionToken) return null;

  const sessionTokenHash = hashSessionToken(sessionToken);
  const now = new Date();

  const session = await Session.findOne({
    sessionTokenHash,
    isValid: true,
    expiresAt: { $gt: now },
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
