// ============================================================
// Internet bot / vulnerability-scanner path detection.
// ------------------------------------------------------------
// Public services attract a constant background of automated
// scans looking for accidentally exposed .env files, phpinfo
// pages, WordPress admin endpoints, and similar. Our app
// (Node + Express) doesn't serve any of these — they 404
// regardless. The patterns here let us skip them from request
// logging AND OTel HTTP instrumentation so they don't:
//
//   - flood VictoriaLogs disk
//   - poison `http_server_request_duration` metrics
//   - eat tail-sampling budget on Tempo
//
// Returning a 404 still happens (Express default) — this is
// purely about cutting observability noise from background junk.
// Real 404s for legitimate paths (e.g. user typos in your own
// API) are NOT skipped — only patterns no real client of yours
// would ever hit.
// ============================================================

const SCANNER_PATTERNS = [
  // .env probes — anywhere in path, all variants (.env.dev, .env~, .env.bak, etc.)
  /\.env(\.|~|$)/i,
  /\/\.env/i,

  // PHP probes (we're a Node app — no .php endpoint exists)
  /\.php(\?|$)/i,
  /phpinfo/i,
  /xmlrpc/i,

  // WordPress / Drupal / Joomla scans
  /^\/wp-(admin|login|content|includes|json)/i,
  /^\/wordpress(\/|$)/i,
  /^\/joomla(\/|$)/i,
  /^\/drupal(\/|$)/i,

  // CMS / framework directory probes
  /^\/(?:vendor|node_modules|\.git|\.svn|\.aws|\.ssh)(\/|$)/i,
  /^\/(?:phpmyadmin|adminer|pma|mysql)(\/|$)/i,

  // Hidden config / dotfile probes
  /^\/\.(?:git|svn|hg|env|aws|ssh|htaccess|htpasswd|DS_Store)/i,
  /\/_environment$/i,
  /^\/(server|status|debug|metrics|actuator)\.(?:php|asp|jsp)$/i,
  /^\/server-status/i,
  /^\/(?:test|info|debug|status)\.(?:php|aspx|jsp)$/i,

  // Common scanner-style endpoints (we don't serve any of these)
  /^\/(?:cgi-bin|fckeditor|webdav)/i,
  /^\/(?:setup|install|installer|installation|backup|backups)\b/i,
  /^\/(?:console|invoker|jmx-console)\b/i,

  // Random short-name PHP files used by scanners (a.php, p.php, i.php, ...)
  /^\/[a-z]{1,3}\.php$/i,

  // _ignition (Laravel exploit) and similar
  /^\/_ignition\b/i,
  /^\/_profiler\b/i,
];

/**
 * Returns true if `path` matches a known internet-scanner pattern
 * (NOT one of your real API routes). False for everything else,
 * including legitimate 404s on your own paths.
 *
 * @param {string} path
 * @returns {boolean}
 */
export const isScannerPath = path => {
  if (typeof path !== 'string' || path.length === 0) return false;
  return SCANNER_PATTERNS.some(re => re.test(path));
};

/**
 * One-stop check: should this request be omitted from logs entirely?
 * Covers:
 *   - /health (Docker healthcheck — every 30s, no value in logs)
 *   - /api-docs* (Swagger UI assets — high-volume browser fetches)
 *   - /favicon* (browser auto-fetch)
 *   - All scanner-noise patterns above
 *
 * Use this from EVERY middleware that emits a per-request log line —
 * requestLogger, errorHandler.notFoundHandler, rate-limiter — so the
 * filter applies uniformly. Dropping this check from any one of them
 * leaks bot-scan noise into VictoriaLogs.
 *
 * @param {string} path
 * @returns {boolean}
 */
export const shouldSkipPathLogging = path => {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (path === '/health') return true;
  if (path.startsWith('/api-docs')) return true;
  if (path.startsWith('/favicon')) return true;
  return isScannerPath(path);
};
