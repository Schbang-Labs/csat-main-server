# CSAT Observability — Debugging Runbook

When something breaks (alert fires, dashboard shows weird numbers, an
endpoint 5xx's), here's how to find what happened. Three pillars:
**metrics tell you something is wrong, logs tell you what, traces tell
you why**.

---

## 1. An alert email arrives — is it real?

### a. First, check Alertmanager UI

```bash
# SSH tunnel from your laptop
ssh -L 9093:127.0.0.1:9093 ubuntu@<EIP>
# Open http://localhost:9093
```

The UI shows every active alert with its labels, annotations, when it
started, and when it last updated. You can:
- **Silence** a specific alert temporarily ("Silence" button)
- See if it's `firing` or `resolved` (resolved = self-healed)
- Check inhibitions

### b. Was it caused by a deploy?

Most "false" `ServiceDown` alerts coincide with a Dockploy redeploy —
brief container restart trips the absence detector. Cross-reference:
- Dockploy → csat-backend → Deployments tab → start time of the most
  recent deploy
- Alert email "Started:" timestamp

If they match within ~5 minutes, it was a deploy. The alert is correct
in saying "service was unreachable" — just not actionable.

### c. Was it real?

Confirm the service is currently healthy:
```bash
# From your laptop:
curl -fs https://api-csat-prod.schbanglabs.com/health | jq .
# {"status":"OK", ...}

# On the EC2 box, verify it's actually exporting:
docker exec dokploy-traefik wget -qO- http://csat-backend:8080/health
```
If both succeed, the alert resolved. The email was a transient blip.

---

## 2. Dashboard shows weird numbers

### a. Find the actual data via Grafana Explore

Grafana → Explore → VictoriaMetrics → paste the same PromQL the panel
uses (right-click the panel → Inspect → Query). Strip the time range to
"Last 1 hour" so you see live data.

If the explorer agrees with the panel, the data really is what it is.
Investigate the source (the app code that emits the metric).

### b. Compare to logs over the same time window

Grafana → Explore → VictoriaLogs:
```
service.name:="csat-server" AND severity:~"error|warn"
```
Set the time range to match the metric anomaly. Errors here usually
explain the metric.

### c. Compare to traces

Find an example of the bad behavior in a trace:
```
{resource.service.name="csat-server" && status = error}
```
Click any trace → see exactly where time was spent + which downstream
call failed.

---

## 3. An API call returns a wrong response

You have the request's `x-request-id` from the response header (e.g.
`d92c4f1a-...`). Use it as the connecting thread:

### a. Find the request in logs

Grafana → Explore → VictoriaLogs:
```
service.name:="csat-server" AND requestId:="d92c4f1a-...."
```
You see every log line that this request produced — usually
`API request received`, plus any middleware logs, plus the completion
line with `statusCode` and `durationMs`. Field `trace_id` is the
correlation key for the next step.

### b. Find the trace

Grafana → Explore → Tempo → "Search" tab → "Span" filter →
`http.request_id` = `d92c4f1a-...`

If found: you see the full span tree (HTTP → Express middleware →
Mongoose query → S3 call etc.) with timings.

If NOT found: tail-sampling probably dropped it. **This is normal for
successful, fast requests** (only 10% of those are kept). Bump
sampling to debug — see "Capture every trace temporarily" below.

### c. Database queries

If a Mongoose query is slow, the auto-instrumentation captured it. Look
inside the trace:
- Span name = `mongoose.<operation>` (e.g. `mongoose.find`)
- `db.statement` attribute (truncated to 1KB by the collector to avoid
  shipping PII)
- `db.collection.name`
- Duration

If `db.statement` shows `...[truncated]`, the actual query was longer
than 1KB and the truncation processor cut it. Adjust
`infra/otel-collector/config.yaml` `transform/truncate` if you need
larger captures.

---

## 4. Logs are flooded with 404s / errors / noise

Find the top offending paths first:
```
service.name:="csat-server" AND _msg:"Route not found"
| stats by (path, method) count() as cnt
| sort by (cnt desc)
| limit 20
```

Common causes and their fixes:

| Cause | Fix |
|---|---|
| Frontend hitting old API paths | Update the frontend or add a redirect/alias in routes |
| Uptime monitor with wrong URL | Update the monitor config to hit `/health` |
| Bot/scanner | Block the IP at the security group, or add the path to `shouldSkipLogging` |
| Path you stopped supporting | Add it to `shouldSkipLogging` in `src/middleware/requestLogger.middleware.js` |

To skip a path from log shipping (the structured `info.path` filter
already runs before VictoriaLogs):

```js
// src/middleware/requestLogger.middleware.js
const shouldSkipLogging = req =>
  req.path === '/health' ||
  req.path.startsWith('/api-docs') ||
  req.path.startsWith('/old-broken-route');
```

---

## 5. Specific cookbook recipes

### Capture every trace temporarily (skip tail sampling)

Edit `infra/otel-collector/config.yaml` → change:
```yaml
- name: probabilistic-rest
  type: probabilistic
  probabilistic:
    sampling_percentage: 10   # → 100
```
Push, redeploy obs-stack. Disk usage on MinIO grows ~10x. **Revert when
done debugging** or you'll fill the volume in days.

### See traffic for a specific route

```promql
# In Grafana → Explore → VictoriaMetrics
sum by (http_route) (
  rate(http_server_request_duration_seconds_count{
    service_name="csat-server",
    http_route="/api/v1/dashboard/stats"
  }[5m])
)
```

### See p99 latency for a route over time

```promql
histogram_quantile(0.99,
  sum by (le) (
    rate(http_server_request_duration_seconds_bucket{
      service_name="csat-server",
      http_route="/api/v1/dashboard/stats"
    }[5m])
  )
)
```

### Find what changed at the moment things broke

1. Note the alert "Started:" timestamp
2. Dockploy → Deployments tab → look for any deploy in the 30 minutes
   before the alert
3. If a deploy correlates: `git log --since="2 hours ago"` to see what
   shipped

### Silence an alert during planned maintenance

Alertmanager UI (port 9093 via SSH tunnel) → "Silences" → "New Silence"
→ matchers `alertname=ServiceDown` or `service_name=csat-server` →
duration 1h → Create. Email storms stop until the silence expires.

### Force-clear a stuck alert

In Alertmanager, alerts auto-resolve when the underlying condition goes
away. If something is stuck firing, check VMAlert UI (port 8880) — the
rule's "Last evaluation" timestamp tells you whether VMAlert is even
running its rule.

```bash
ssh -L 8880:127.0.0.1:8880 ubuntu@<EIP>
# http://localhost:8880 → Groups → click the rule
```

---

## 6. When the observability stack itself is broken

### One service stuck restarting
```bash
docker ps --filter status=restarting
docker logs <name> --tail 30
```
Common: bad config after edit. Revert via git, redeploy.

### Disk full
```bash
df -h /
docker system df
```
If `/var/lib/docker` is the culprit:
- VictoriaLogs disk use? Reduce `-retentionPeriod`
- Tempo's MinIO bucket? Check `docker exec minio du -sh /data`
- Old image layers? `docker system prune -af`

### Grafana shows red datasource
- Connections → Data sources → click datasource → "Test"
- If failing, check the URL: it should be `http://victoriametrics:8428`
  / `http://victorialogs:9428` / `http://tempo:3200` (container DNS, not
  localhost)
- Network test: `docker exec grafana wget -qO- http://victoriametrics:8428/health`

### Alerts not arriving
1. Alertmanager UI → confirm the alert is there
2. Alertmanager → "Notifications log" tab (if available) or
   `docker logs alertmanager 2>&1 | grep -iE "smtp|notify|error"`
3. If SMTP error: re-derive `SMTP_PASSWORD` (it's HMAC of
   `AWS_SECRET_ACCESS_KEY` for `ap-south-1`) and update Dockploy env.

---

## 7. The flow chart

```
Dashboard panel weird?
        │
        ├── Confirm in raw query (Explore + same PromQL)
        │       │
        │       └── Wrong → fix dashboard query
        │       └── Right → search logs at same time window
        │
Logs show errors?
        │
        ├── Take requestId / trace_id
        │       │
        │       └── Search Tempo for the trace
        │               │
        │               └── Trace exists → look at span tree, find slowest/erroring span
        │               └── Trace missing → was sampled out (90% probability for fast successes)
        │                       │
        │                       └── Bump sampling to 100% temporarily, reproduce, revert
        │
Service down alert?
        │
        ├── Was a deploy active in the last 5 min?  → false alarm, ignore
        ├── /health responding now?                 → resolved, ignore
        ├── /health failing?                        → real outage, troubleshoot via logs
```

---

## 8. Quick reference — useful URLs (via SSH tunnel)

```bash
# Public (TLS, no tunnel needed)
https://grafana-csat-prod.schbanglabs.com    # dashboards + Explore
https://api-csat-prod.schbanglabs.com        # the app

# Internal (need SSH tunnel — replace EIP)
ssh -L 9093:127.0.0.1:9093 \
    -L 8880:127.0.0.1:8880 \
    -L 8428:127.0.0.1:8428 \
    -L 9428:127.0.0.1:9428 \
    ubuntu@<EIP>

http://localhost:9093    # Alertmanager UI (silences, inhibitions)
http://localhost:8880    # VMAlert UI (rules, last eval)
http://localhost:8428    # VictoriaMetrics raw API
http://localhost:9428    # VictoriaLogs raw API (LogsQL)
```
