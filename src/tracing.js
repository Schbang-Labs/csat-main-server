// ============================================================
// OpenTelemetry SDK bootstrap — Phase 1 (metrics)
// ------------------------------------------------------------
// Loaded BEFORE any application code via:
//   node --import ./src/tracing.js src/server.js
// or NODE_OPTIONS=--import /app/src/tracing.js (in Docker).
//
// This file MUST run before any module the SDK wants to patch
// (express, mongoose, http, aws-sdk-v3) — the auto-instrumentation
// hooks intercept require/import, and modules already in the cache
// can't be re-instrumented.
//
// Phase 1 ships METRICS only:
//   - HTTP RED metrics from auto-instrumentation
//   - Mongoose op metrics from auto-instrumentation
//   - Process / runtime metrics from @opentelemetry/host-metrics
// Phase 2 adds logs (Winston transport).
// Phase 3 adds traces (OTLP trace exporter).
// ============================================================

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { metrics } from '@opentelemetry/api';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EventEmitter } from 'node:events';

// Auto-instrumentation attaches a 'finish' listener per request on every
// ServerResponse, which trips Node's default 10-listener warning under
// concurrent load. Raise the default for ALL future emitters (including
// per-request ServerResponse instances). Existing emitters are unaffected,
// but this runs before the HTTP server is created, so we're fine.
EventEmitter.defaultMaxListeners = 20;

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

const OTEL_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317';
const SERVICE_NAME =
  process.env.OTEL_SERVICE_NAME || pkg.name || 'csat-server';
const ENV = process.env.NODE_ENV || 'development';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: SERVICE_NAME,
  [ATTR_SERVICE_VERSION]: pkg.version,
  'service.namespace': 'schbang',
  'service.instance.id': process.env.HOSTNAME || 'local',
  'deployment.environment': ENV,
  'deployment.environment.name': ENV,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({ url: OTEL_ENDPOINT }),
  exportIntervalMillis: 15000,
});

const logRecordProcessor = new BatchLogRecordProcessor(
  new OTLPLogExporter({ url: OTEL_ENDPOINT })
);

// Send 100% of traces to the Collector. The Collector's tail_sampling
// processor drops 90% of normal traffic but keeps 100% of errored / slow
// traces — see infra/otel-collector/config.yaml. Setting head sampling
// here would break that decision because sampled-out spans never arrive.
const traceExporter = new OTLPTraceExporter({ url: OTEL_ENDPOINT });

const otelSdk = new NodeSDK({
  resource,
  traceExporter,
  metricReaders: [metricReader],
  logRecordProcessors: [logRecordProcessor],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Skip /health, /api-docs, /favicon, AND known internet-scanner
      // probe paths (.env, phpinfo, wp-admin, etc.). Without this filter,
      // every bot scan would burn tail-sampling budget on Tempo and
      // pollute http_server_* metrics with bogus 404s. We can't import
      // utils/scannerPaths.js here because the regex import path may
      // not resolve before tracing.js loads — inline the same patterns
      // (kept in sync manually with src/utils/scannerPaths.js).
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (req) => {
          const url = req.url || '';
          if (
            url === '/health' ||
            url.startsWith('/api-docs') ||
            url.startsWith('/favicon')
          ) {
            return true;
          }
          // Scanner-noise patterns — see src/utils/scannerPaths.js for the
          // canonical list. Keep these in sync.
          return (
            /\.env(\.|~|$)/i.test(url) ||
            /\/\.env/i.test(url) ||
            /\.php(\?|$)/i.test(url) ||
            /phpinfo|xmlrpc|server-status|_ignition|_profiler/i.test(url) ||
            /^\/(wp-|wordpress|phpmyadmin|adminer|pma|cgi-bin|setup\b|install\b)/i.test(url) ||
            /^\/\.(?:git|svn|hg|aws|ssh|htaccess|htpasswd|DS_Store)/i.test(url) ||
            /^\/_environment$/i.test(url) ||
            /^\/[a-z]{1,3}\.php$/i.test(url)
          );
        },
      },
      // Winston: keep auto trace_id/span_id INJECTION (correlation) but
      // disable auto log SENDING — the explicit OpenTelemetryTransportV3
      // in src/config/logger.js owns the export path so we can apply a
      // filter format (drops /health rate-limit noise) before logs ship.
      '@opentelemetry/instrumentation-winston': {
        disableLogSending: true,
      },
      // Disable noisy / low-value auto-instrumentations.
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
    }),
  ],
});

otelSdk.start();

// Host / runtime metrics need to attach AFTER the SDK is started so they
// can pick up the meter provider it installed on the global API.
const hostMetrics = new HostMetrics({
  meterProvider: metrics.getMeterProvider(),
  name: SERVICE_NAME,
});
hostMetrics.start();

// Shutdown is owned by src/server.js — it calls `await otelSdk.shutdown()`
// inside the HTTP-close callback BEFORE disconnectDB(), so the last metric
// export window flushes in the right order. Don't register signal handlers
// here or both will race.

export { otelSdk };
