const ALLOWED_CLIENT_TYPES = new Set(['admin', 'sbu']);

export const clientContextMiddleware = (req, _res, next) => {
  const incomingClientType = String(req.headers['x-client-type'] || 'unknown')
    .trim()
    .toLowerCase();

  req.clientType = ALLOWED_CLIENT_TYPES.has(incomingClientType)
    ? incomingClientType
    : 'unknown';

  next();
};

export default clientContextMiddleware;
