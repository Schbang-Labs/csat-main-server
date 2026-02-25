const SENSITIVE_KEYS = [
  'password',
  'pass',
  'token',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'apikey',
  'clientSecret',
  'refreshToken',
  'accessToken',
  'idToken',
  'session',
  'otp',
  'pin',
];

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 100;
const MAX_DEPTH = 5;

const isSensitiveKey = key => {
  if (!key) return false;
  const normalized = String(key).toLowerCase();
  return SENSITIVE_KEYS.some(secretKey =>
    normalized.includes(secretKey.toLowerCase())
  );
};

const getRequestUserId = req =>
  req?.user?._id?.toString?.() || req?.user?.id || null;

const sanitizeString = value => {
  if (value.length <= MAX_STRING_LENGTH) return value;
  const omittedChars = value.length - MAX_STRING_LENGTH;
  return `${value.slice(0, MAX_STRING_LENGTH)}...[${omittedChars} chars truncated]`;
};

const sanitizeValue = (value, depth, seen) => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return `[Buffer: ${value.length} bytes]`;
  }

  if (depth >= MAX_DEPTH) {
    return Array.isArray(value)
      ? `[Array(${value.length})]`
      : '[Object]';
  }

  if (Array.isArray(value)) {
    const sanitized = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map(item => sanitizeValue(item, depth + 1, seen));

    if (value.length > MAX_ARRAY_ITEMS) {
      sanitized.push(`[${value.length - MAX_ARRAY_ITEMS} more item(s)]`);
    }

    return sanitized;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    const entries = Object.entries(value);
    const result = {};
    for (const [index, [key, nestedValue]] of entries.entries()) {
      if (index >= MAX_OBJECT_KEYS) {
        result.__truncatedKeys = `${entries.length - MAX_OBJECT_KEYS} more key(s)`;
        break;
      }

      result[key] = isSensitiveKey(key)
        ? '[REDACTED]'
        : sanitizeValue(nestedValue, depth + 1, seen);
    }

    seen.delete(value);
    return result;
  }

  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }

  return String(value);
};

export const sanitizeForLogs = value => sanitizeValue(value, 0, new WeakSet());

export const buildRequestLogMeta = req => ({
  requestId: req.requestId || null,
  method: req.method,
  path: req.originalUrl || req.path,
  route: req.route?.path || null,
  ip: req.ip,
  userId: getRequestUserId(req),
  clientType: req.clientType || null,
  params: sanitizeForLogs(req.params || {}),
  query: sanitizeForLogs(req.query || {}),
  body: sanitizeForLogs(req.body || {}),
});

export const getRequestUserIdSafe = getRequestUserId;
