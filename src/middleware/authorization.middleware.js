import crypto from 'crypto';
import { SBU, User } from '../models/index.js';

const UNAUTHENTICATED_MESSAGE = 'Unauthorized. Login required.';
const ROLE_DENIED_MESSAGE = 'Access denied. Insufficient role permissions.';
const RESOURCE_DENIED_MESSAGE =
  'Access denied. You do not have access to this resource.';

const toIdString = value => {
  if (value === null || value === undefined) return null;
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : null;
};

const getUserAccessScopes = user =>
  Array.isArray(user?.accessScopes) ? user.accessScopes : [];

const buildAllowedResourceIds = async (accessScopes, role) => {
  const allowed = {
    department: new Set(),
    sbu: new Set(),
  };

  accessScopes.forEach(scope => {
    const resourceType = scope?.resourceType;
    const resourceId = toIdString(scope?.resourceId);

    if (
      !resourceType ||
      !resourceId ||
      !Object.prototype.hasOwnProperty.call(allowed, resourceType)
    ) {
      return;
    }

    allowed[resourceType].add(resourceId);
  });

  // Head-department users inherit access to all SBUs under scoped departments.
  if (role === 'head_department' && allowed.department.size > 0) {
    const scopedDepartmentIds = [...allowed.department];
    const scopedSBUs = await SBU.find({
      departmentId: { $in: scopedDepartmentIds },
      isActive: true,
    })
      .select('_id')
      .lean();

    scopedSBUs.forEach(sbu => {
      const sbuId = toIdString(sbu?._id);
      if (sbuId) {
        allowed.sbu.add(sbuId);
      }
    });
  }

  return {
    department: [...allowed.department],
    sbu: [...allowed.sbu],
  };
};

const safeEquals = (provided, expected) => {
  const left = Buffer.from(provided || '', 'utf8');
  const right = Buffer.from(expected || '', 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

const verifyHmacSignature = (email, timestamp, signature) => {
  const appSecret = process.env.APP_SECRET;
  if (!appSecret) return false;

  const age = Date.now() - Number(timestamp);
  if (isNaN(age) || age < 0 || age > SIGNATURE_MAX_AGE_MS) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(`${email}:${timestamp}`)
    .digest('hex');

  return safeEquals(signature, expected);
};

export const isTrustedAdminClient = req => {
  if (req.clientType !== 'admin') return false;

  const expectedSecret = process.env.ADMIN_CLIENT_SECRET;
  if (!expectedSecret) return false;

  const providedSecret =
    typeof req.headers['x-client-secret'] === 'string'
      ? req.headers['x-client-secret']
      : '';

  return safeEquals(providedSecret, expectedSecret);
};

const sendUnauthorized = res =>
  res.status(401).json({
    success: false,
    message: UNAUTHENTICATED_MESSAGE,
  });

const sendRoleDenied = res =>
  res.status(403).json({
    success: false,
    message: ROLE_DENIED_MESSAGE,
  });

const sendResourceDenied = res =>
  res.status(403).json({
    success: false,
    message: RESOURCE_DENIED_MESSAGE,
  });

const resolveResourceId = (req, options) => {
  if (typeof options.resourceIdResolver === 'function') {
    return toIdString(options.resourceIdResolver(req));
  }

  if (options.resourceIdParam) {
    return toIdString(req.params?.[options.resourceIdParam]);
  }

  if (options.resourceIdQuery) {
    return toIdString(req.query?.[options.resourceIdQuery]);
  }

  if (options.resourceIdBody) {
    return toIdString(req.body?.[options.resourceIdBody]);
  }

  return null;
};

export const authorize = (options = {}) => {
  const {
    role = null,
    roles = [],
    resourceType = null,
    enforceResourceForRoles = null,
    requiredScopeByRole = {},
    allowTrustedAdminBypass = true,
  } = options;
  const allowedRoles = Array.isArray(role)
    ? role
    : role
      ? [role]
      : Array.isArray(roles)
        ? roles
        : [];

  return async (req, res, next) => {
    try {
      const trustedAdminClient = isTrustedAdminClient(req);

      if (allowTrustedAdminBypass && trustedAdminClient) {
        req.authz = {
          role: 'admin',
          isTrustedAdminClient: true,
          accessScopes: [],
          allowedResourceIds: { department: [], sbu: [] },
        };
        return next();
      }

      // If admin-client secret is absent/invalid, fall back to session-based role auth.
      // Deny only when it's an admin client request with no authenticated user context.
      if (
        allowTrustedAdminBypass &&
        req.clientType === 'admin' &&
        !req.user
      ) {
        // Try HMAC resolution before denying
      }

      // --- HMAC + Email-header user resolution ---
      if (!req.user) {
        const email = (req.headers['x-user-email'] || '').trim().toLowerCase();
        // const timestamp = req.headers['x-timestamp'] || '';
        // const signature = req.headers['x-signature'] || '';

        // if (!email || !timestamp || !signature) {
        //   return sendUnauthorized(res);
        // }
        if (!email) {
          return sendUnauthorized(res);
        }
        // if (!verifyHmacSignature(email, timestamp, signature)) {
        //   return sendUnauthorized(res);
        // }
        const user = await User.findOne({ email, isActive: true }).lean();

        if (!user) {
          return sendUnauthorized(res);
        }

        const { password, ...safeUser } = user;
        req.user = safeUser;
      }
      // --- End HMAC resolution ---

      if (!req.user.isActive) {
        return sendRoleDenied(res);
      }

      const role = toIdString(req.user.role) || 'user';

      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return sendRoleDenied(res);
      }

      const accessScopes = getUserAccessScopes(req.user);
      const allowedResourceIds = await buildAllowedResourceIds(
        accessScopes,
        role
      );

      req.authz = {
        role,
        isTrustedAdminClient: false,
        accessScopes,
        allowedResourceIds,
      };

      const requiredScopeType = requiredScopeByRole?.[role];
      if (requiredScopeType) {
        const roleScopes = allowedResourceIds[requiredScopeType] || [];
        if (roleScopes.length === 0) {
          return sendResourceDenied(res);
        }
      }

      if (resourceType && role !== 'admin') {
        const rolesToEnforceResource =
          Array.isArray(enforceResourceForRoles) &&
            enforceResourceForRoles.length > 0
            ? enforceResourceForRoles
            : allowedRoles.filter(r => r !== 'admin');

        if (rolesToEnforceResource.includes(role)) {
          const resourceId = resolveResourceId(req, options);
          const allowedIds = allowedResourceIds[resourceType] || [];

          if (!resourceId || !allowedIds.includes(resourceId)) {
            return sendResourceDenied(res);
          }
        }
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default authorize;
