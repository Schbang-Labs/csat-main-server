# CSAT Observability Stack — operator notes

Self-hosted stack for the CSAT backend. Through Phase 4 (metrics + logs + traces + alerts).

> **Deploying this to production?** See [DOCKPLOY_DEPLOYMENT.md](DOCKPLOY_DEPLOYMENT.md) — full step-by-step guide from EC2 provisioning through HTTPS-enabled Dockploy deploy.

## Boot order (matters)

```bash
# 1. Obs stack first (creates `obs-net` external network)
docker compose -f infra/observability/docker-compose.yml up -d

# 2. App stack second (joins obs-net)
HOST_PORT=8081 docker compose up -d   # default 8080 may collide locally
```

App stack will fail with `network obs-net declared as external, but could not be found` if you skip step 1.

## Endpoints

| Service | Local URL | Notes |
|---|---|---|
| Backend | `http://localhost:${HOST_PORT:-8080}` | App routes + `/health` |
| Grafana | `http://localhost:${GRAFANA_PORT:-a}` | UI; admin / `${GRAFANA_ADMIN_PASSWORD:-admin}` |
| VictoriaMetrics | `http://localhost:${VM_PORT:-8428}` | Raw query API; debug only |
| VictoriaLogs | `http://localhost:${VLOGS_PORT:-9428}` | Raw LogsQL API; debug only |
| Alertmanager | `http://localhost:${ALERTMANAGER_PORT:-9093}` | UI to view firing alerts, silence, inhibit |
| VMAlert | `http://localhost:${VMALERT_PORT:-8880}` | UI to view rules, evaluation state |
| OTel Collector | (internal only) `otel-collector:4317` (gRPC), `:4318` (HTTP) | Not exposed to host |
| Tempo | (internal only) `tempo:3200` | Queried via Grafana Tempo datasource |
| MinIO | (internal only) `minio:9000` | S3 backend for Tempo trace blocks |

All obs ports bind to `127.0.0.1` by default. Override with `OBS_BIND_IP=0.0.0.0` for LAN access during dev. **Never** bind to public interfaces in production — VM has no auth and Grafana should sit behind Traefik with TLS.

## Required env vars

For the obs stack (set via Dockploy UI in production, `.env` for local):

| Var | Default | Notes |
|---|---|---|
| `GRAFANA_ADMIN_USER` | `admin` | Initial admin login |
| `GRAFANA_ADMIN_PASSWORD` | `admin` | **MUST be set in production** |
| `VM_PORT` | `8428` | Host port for VictoriaMetrics |
| `VLOGS_PORT` | `9428` | Host port for VictoriaLogs |
| `GRAFANA_PORT` | `3001` | Host port for Grafana |
| `ALERTMANAGER_PORT` | `9093` | Host port for Alertmanager UI |
| `VMALERT_PORT` | `8880` | Host port for VMAlert UI |
| `OBS_BIND_IP` | `127.0.0.1` | Bind interface for all obs ports |
| `MINIO_ROOT_USER` | `tempo_user` | MinIO root user for Tempo bucket |
| `MINIO_ROOT_PASSWORD` | `tempo_password_change_me` | **Change in production** |
| `SMTP_HOST` | (none) | AWS SES SMTP endpoint — `email-smtp.<region>.amazonaws.com` |
| `SMTP_PORT` | `587` | STARTTLS (SES also supports 465 for SSL, 2587 if 587 blocked) |
| `SMTP_USERNAME` | (none) | **SES SMTP username** — not your IAM access key. Generate via SES → SMTP Settings → "Create SMTP Credentials" |
| `SMTP_PASSWORD` | (none) | **SES SMTP password** — paired with the username above; ~44-char base64 string |
| `SMTP_FROM` | (none) | Sender address — must be a **verified identity** in SES (email or domain) |
| `SMTP_REQUIRE_TLS` | `true` | SES requires TLS; never set to `false` |
| `ALERT_EMAIL_CRITICAL` | (none) | Comma-separated To: list for `severity=critical`. In **SES sandbox** mode each address must be verified. |
| `ALERT_EMAIL_WARNING` | (none) | Comma-separated To: list for `severity=warning`/`info`. Same sandbox rule. |

### Grafana plugin caveat

The VictoriaLogs datasource (`victoriametrics-logs-datasource`) is fetched
from `grafana.com/api/plugins` on **every** Grafana container start. If that
host is unreachable when the container boots, the plugin won't install and
the logs dashboard will be red. For production, bake the plugin into a
custom Grafana image (pinned SHA) instead of relying on `GF_INSTALL_PLUGINS`.

For the app stack: see [.env.runtime.example](../.env.runtime.example).

## Dashboards as code

Dashboards live in [grafana/dashboards/](grafana/dashboards/) as committed JSON. Grafana scans every 30s and reloads (`allowUiUpdates: true` so UI tweaks survive between scans, but they're **clobbered** when the file changes). To make a UI change permanent: in Grafana → Dashboard → Settings → JSON Model → copy → commit to the file.

## Phase 4 — alerts at a glance

**8 production rules + 1 TestPing** evaluated by VMAlert every 30s, routed
through Alertmanager to SMTP. See [vmalert/rules/](vmalert/rules/) for definitions.

| Rule | Severity | When |
|---|---|---|
| `HighHttp5xxRate` | critical | 5xx ratio > 1% for 5m |
| `P95LatencyDegraded` | warning | p95 > 1s on any route for 10m |
| `ServiceDown` | critical | No `target_info` for 2m |
| `EventLoopLagHigh` | warning | p99 > 200ms for 5m |
| `MongoPoolExhausted` | warning | Pool used > 90% for 3m |
| `CronBackupMissed` | critical | Last success > 35d ago (immediate) |
| `DiskUsageHigh` | warning | Host filesystem > 85% for 5m |
| `ContainerRestartLoop` | critical | > 3 restarts in 15m |
| `VictoriaLogsDiskNearLimit` | critical | Filesystem > 95% (vlogs stops writing < 1GB free) |
| `TestPing` | info | **Always fires.** Delete `vmalert/rules/test.yaml` after first email. |

**Inhibition**: when a `critical` for a `service_name` is firing, matching
`warning` alerts for the same service are suppressed (no duplicate notifications).

**Routing** ([alertmanager/alertmanager.yaml](alertmanager/alertmanager.yaml)):
- `critical` → `${ALERT_EMAIL_CRITICAL}`, 1h re-notify
- `warning` / `info` → `${ALERT_EMAIL_WARNING}`, 4h / 24h re-notify

**Removing TestPing** once SMTP is verified:
```bash
rm infra/vmalert/rules/test.yaml
docker compose -f infra/observability/docker-compose.yml restart vmalert
```

## AWS SES setup (one-time, per region)

Alertmanager talks plain SMTP — SES provides an SMTP endpoint. The pieces:

1. **Verify the FROM identity** (always required, sandbox or not):
   - SES Console → Verified identities → Create identity
   - Either an email (quick, gets a verification link) or a whole domain (DNS records — recommended for prod)
   - Region matters — verify in the same region you'll send from. We default to `ap-south-1` (matches the rest of your AWS stack).

2. **Verify recipient identities** (only if SES account is still in sandbox):
   - Same flow as above, repeat for each `ALERT_EMAIL_CRITICAL` / `ALERT_EMAIL_WARNING` address.
   - Skip this if you've requested + been granted production access (SES Console → Account dashboard → "Request production access"). Production accounts can send to any address.

3. **Generate SMTP credentials** (these are NOT your IAM keys):
   - SES Console → SMTP Settings → **Create SMTP Credentials**
   - Behind the scenes this creates an IAM user with `ses:SendRawEmail` and gives you a username (`AKIA…`) and password (~44-char base64).
   - **Save them now — the password is shown only once.**
   - Set into `.env.runtime` as `SMTP_USERNAME` and `SMTP_PASSWORD`.

4. **(Optional but useful)**: enable bounce + complaint notifications via SNS so misdelivered alert emails surface somewhere.

## Stack lifecycle

```bash
# Status
docker compose -f infra/observability/docker-compose.yml ps
docker compose ps

# Logs
docker compose -f infra/observability/docker-compose.yml logs -f otel-collector

# Tear down (volumes preserved)
docker compose down
docker compose -f infra/observability/docker-compose.yml down

# Wipe metrics history
docker compose -f infra/observability/docker-compose.yml down -v
```

## Phase roadmap

| Phase | Status | Adds |
|---|---|---|
| 0 — Containerize | ✅ done | Dockerfile, app compose |
| 1 — Metrics | ✅ done | OTel SDK, collector, VM, Grafana, RED + runtime dashboards |
| 2 — Logs | ✅ done | VictoriaLogs, Winston OTel transport, log dashboard, PII scrub + db.statement truncation |
| 3 — Traces | ✅ done | Tempo + MinIO, trace↔logs↔metrics correlation, tail sampling |
| 4 — Alerts | ✅ done | VMAlert + Alertmanager + node-exporter + cadvisor, 9 rules, SMTP email |
| 4 — Alerts | future | VMAlert + Alertmanager, SMTP, alert rules |
| 5 — CI/CD | future | Dockploy git webhook auto-deploy |
