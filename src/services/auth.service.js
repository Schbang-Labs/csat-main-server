import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import { validateSessionToken } from './session.service.js';

const BCRYPT_ROUNDS = 12;
const USER_ROLES = new Set(['user', 'admin', 'head_department', 'sbu']);
const ACCESS_RESOURCE_TYPES = new Set(['department', 'sbu']);

const normalizeEmail = email => (email || '').trim().toLowerCase();
const toTrimmedString = value =>
  value === null || value === undefined ? '' : String(value).trim();

const normalizeAccessControl = user => {
  if (!user) return;

  if (!USER_ROLES.has(user.role)) {
    user.role = 'user';
  }

  if (!Array.isArray(user.accessScopes)) {
    user.accessScopes = [];
  }
};

export const sanitizeUser = user => {
  if (!user) return null;

  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  return safeUser;
};

export const registerWithEmailPassword = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = password
    ? await bcrypt.hash(password, BCRYPT_ROUNDS)
    : null;

  const user = await User.create({
    name: name ? name.trim() : normalizedEmail,
    email: normalizedEmail,
    password: hashedPassword,
    provider: 'local',
    role: 'user',
    accessScopes: [],
    isActive: true,
  });

  return sanitizeUser(user);
};

export const loginWithEmailPassword = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('User account is inactive');
    error.statusCode = 403;
    throw error;
  }

  if (user.provider === 'google' && !user.password) {
    const error = new Error('Use Google login for this accoun');
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  normalizeAccessControl(user);
  user.lastLoginAt = new Date();
  await user.save();

  return sanitizeUser(user);
};

const verifyGoogleIdToken = async idToken => {
  if (!idToken) {
    const error = new Error('Google ID token is required');
    error.statusCode = 400;
    throw error;
  }

  if (typeof globalThis.fetch !== 'function') {
    const error = new Error('Global fetch API is unavailable in this runtime');
    error.statusCode = 500;
    throw error;
  }

  const controller = new globalThis.AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let payload;
  try {
    const response = await globalThis.fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );

    payload = await response.json();

    if (!response.ok || payload.error_description || payload.error) {
      const error = new Error('Invalid Google ID token');
      error.statusCode = 401;
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }

  if (payload.email_verified !== 'true') {
    const error = new Error('Google email is not verified');
    error.statusCode = 401;
    throw error;
  }

  if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    const error = new Error('Google token audience mismatch');
    error.statusCode = 401;
    throw error;
  }

  return {
    email: normalizeEmail(payload.email),
    name: payload.name || payload.given_name || payload.email,
  };
};

export const loginWithGoogle = async ({ idToken }) => {
  const googleProfile = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ email: googleProfile.email });

  if (!user) {
    user = await User.create({
      name: googleProfile.name,
      email: googleProfile.email,
      password: null,
      provider: 'google',
      role: 'user',
      accessScopes: [],
      isActive: true,
      lastLoginAt: new Date(),
    });
    return sanitizeUser(user);
  }

  if (!user.isActive) {
    const error = new Error('User account is inactive');
    error.statusCode = 403;
    throw error;
  }

  normalizeAccessControl(user);
  user.name = googleProfile.name;
  user.provider = 'google';
  user.lastLoginAt = new Date();
  await user.save();

  return sanitizeUser(user);
};

export const getCurrentUserBySessionToken = async sessionToken => {
  const validated = await validateSessionToken(sessionToken);
  return sanitizeUser(validated?.user || null);
};

const normalizeRole = role => {
  const normalizedRole = toTrimmedString(role);
  if (!normalizedRole) {
    const error = new Error('role must be a non-empty string');
    error.statusCode = 400;
    throw error;
  }

  if (!USER_ROLES.has(normalizedRole)) {
    const error = new Error(
      'role must be one of: user, admin, head_department, sbu'
    );
    error.statusCode = 400;
    throw error;
  }

  return normalizedRole;
};

const normalizeAccessScopes = accessScopes => {
  if (!Array.isArray(accessScopes)) {
    const error = new Error('accessScopes must be an array');
    error.statusCode = 400;
    throw error;
  }

  const seenScopes = new Set();
  const normalizedScopes = [];

  for (let index = 0; index < accessScopes.length; index += 1) {
    const scope = accessScopes[index] || {};
    const resourceType = toTrimmedString(scope.resourceType);
    const resourceId = toTrimmedString(scope.resourceId);

    if (!resourceType || !ACCESS_RESOURCE_TYPES.has(resourceType)) {
      const error = new Error(
        `accessScopes[${index}].resourceType must be one of: department, sbu`
      );
      error.statusCode = 400;
      throw error;
    }

    if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
      const error = new Error(
        `accessScopes[${index}].resourceId must be a valid ObjectId`
      );
      error.statusCode = 400;
      throw error;
    }

    const key = `${resourceType}:${resourceId}`;
    if (seenScopes.has(key)) {
      continue;
    }
    seenScopes.add(key);

    normalizedScopes.push({
      resourceType,
      resourceId: new mongoose.Types.ObjectId(resourceId),
    });
  }

  return normalizedScopes;
};

export const updateUserByEmail = async ({ email, role, accessScopes }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const error = new Error('email is required');
    error.statusCode = 400;
    throw error;
  }

  const updates = {};

  if (role !== undefined) {
    updates.role = normalizeRole(role);
  }

  if (accessScopes !== undefined) {
    updates.accessScopes = normalizeAccessScopes(accessScopes);
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error('At least one of role or accessScopes must be provided');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (updates.role !== undefined) {
    user.role = updates.role;
  }

  if (updates.accessScopes !== undefined) {
    user.accessScopes = updates.accessScopes;
  }

  await user.save();
  return sanitizeUser(user);
};

export const getUserByEmail = async email => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const error = new Error('email is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
};

export default {
  sanitizeUser,
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginWithGoogle,
  getCurrentUserBySessionToken,
  updateUserByEmail,
  getUserByEmail,
};
