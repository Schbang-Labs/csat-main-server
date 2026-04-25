# CSAT Backend — Production Deployment Guide (AWS EC2 + Dockploy)

Step-by-step guide to take everything you've built locally and put it on a single AWS EC2 VPS managed by Dockploy. Estimated time: **2–3 hours** if you've never done this before, **45 min** if you have.

--

## Table of contents

1. [What you'll have at the end](#1-what-youll-have-at-the-end)
2. [Prerequisites](#2-prerequisites)
3. [Pre-deployment checklist (do these first)](#3-pre-deployment-checklist-do-these-first)
4. [Provision the EC2 instance](#4-provision-the-ec2-instance)
5. [Configure DNS](#5-configure-dns)
6. [Initial server prep](#6-initial-server-prep)
7. [Install Dockploy](#7-install-dockploy)
8. [Connect the repo to Dockploy](#8-connect-the-repo-to-dockploy)
9. [Deploy the observability stack first](#9-deploy-the-observability-stack-first)
10. [Deploy the CSAT backend](#10-deploy-the-csat-backend)
11. [Configure HTTPS via Dockploy](#11-configure-https-via-dockploy)
12. [Post-deploy verification](#12-post-deploy-verification)
13. [Day-2 operations](#13-day-2-operations)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What you'll have at the end

Two public HTTPS endpoints behind Let's Encrypt TLS:

```
https://api.your-domain.com         →  CSAT backend (Express)
https://grafana.your-domain.com     →  Grafana (dashboards + Tempo + logs)
```

And these private services on the EC2 VPS (not exposed to the internet):
- VictoriaMetrics, VictoriaLogs, Tempo, MinIO
- OTel Collector, VMAlert, Alertmanager, node-exporter, cadvisor

Alert emails delivered via AWS SES.

---

## 2. Prerequisites

You need:

| Item | Why |
|---|---|
| AWS account with billing enabled | EC2 + EBS + (optionally) Route 53 |
| A domain you control | For `api.your-domain.com` and `grafana.your-domain.com` (any registrar — Cloudflare, Route 53, GoDaddy, etc.) |
| MongoDB Atlas project + cluster | Database (you already have one) |
| AWS SES verified identity (`secondbrain@schbanglabs.com`) — already done | Sending alert emails |
| The CSAT repo pushed to GitHub | Dockploy clones it |
| SSH key pair (or willing to create one in AWS) | To access EC2 |
| ~$50/month AWS budget | t3.large + 50 GB EBS |

---

## 3. Pre-deployment checklist (do these first)

### 3a. Rotate exposed secrets

[.env](../.env) currently contains live AWS access keys, MongoDB Atlas URI password, JWT secret, and OpenRouter API key — all committed to git history at some point. **Before any production deploy:**

1. **AWS** — IAM Console → Users → `<the user with key AKIA5RSNW…>` → Security credentials → Make active key inactive → Create new access key. Save the new key + secret.
2. **Mongo Atlas** — Atlas → Database Access → wa_db_user → Edit → "Edit Password" → save new password.
3. **JWT secret** — generate a fresh one: `openssl rand -base64 64`. Sessions issued before rotation will become invalid (users have to re-login once).
4. **OpenRouter** — dashboard → Keys → revoke old, create new.
5. After rotating: run the SMTP password derivation script again with the **new** AWS secret (see [.env.runtime](../.env.runtime) header comment).

### 3b. Atlas IP allowlist

Once you know the EC2 instance's Elastic IP (step 4), go to Atlas → Network Access → Add IP Address → enter that IP/32 → comment "csat-prod EC2".

### 3c. SES production access

By default SES is in **sandbox** mode — only verified email addresses can be senders OR receivers. To send alerts to anyone:

1. AWS Console → SES → Account dashboard → "Request production access"
2. Fill the form: use case "Transactional" → website URL → expected volume (low for alerts)
3. Approval usually within 24 hours

If you stay in sandbox for now, every address in `ALERT_EMAIL_CRITICAL` and `ALERT_EMAIL_WARNING` must be verified individually in SES → Verified identities.

### 3d. Commit your work

Dockploy clones the repo over git, so all the files we've built must be on the remote.

```bash
cd /Users/chetan/Chetan/csat-main-server
git add .gitignore .dockerignore Dockerfile docker-compose.yml .env.runtime.example
git add infra/ src/tracing.js src/utils/otelMetrics.js
git add package.json package-lock.json
git add src/config/ src/middleware/ src/server.js
git diff --cached --stat   # double-check what's about to be committed; should NOT include .env or .env.runtime
git commit -m "feat: production-ready observability + Dockploy deploy artifacts (Phases 0-4)"
git push origin main
```

---

## 4. Provision the EC2 instance

### 4a. Launch the instance

AWS Console → EC2 → Launch instances:

| Setting | Value | Notes |
|---|---|---|
| **Name** | `csat-prod-1` | Whatever you like |
| **AMI** | **Ubuntu Server 24.04 LTS** (HVM, SSD) | x86_64 — Dockploy supports both x86_64 and arm64 but x86_64 has wider compatibility |
| **Instance type** | **t3.large** (2 vCPU, 8 GB RAM) | Min for the full stack. Bump to t3.xlarge (16 GB) if you'll add more services later. |
| **Key pair** | Create new or use existing | Save the .pem file safely |
| **Network settings** | Default VPC + default subnet | Or use your own VPC if you have one |
| **Auto-assign public IP** | Enable | Replaced by Elastic IP in step 4c |
| **Storage** | **50 GB gp3** | ⚠️ **Default is 8 GB — you MUST expand this in the launch wizard.** 30 GB minimum; 50 GB gives breathing room for 90d of metrics + 30d of logs + 7d of traces + Docker images. If you forget, you can grow the EBS later (AWS Console → Volumes → Modify) but you'll have to repair a full disk first. |

### 4b. Security group

Create a new security group named `csat-prod-sg` with these inbound rules:

| Type | Port | Source | Purpose |
|---|---|---|---|
| SSH | 22 | **Your office IP/32** (or My IP) | SSH access — never `0.0.0.0/0` |
| HTTP | 80 | 0.0.0.0/0 | Let's Encrypt HTTP-01 challenge + Traefik HTTP→HTTPS redirect |
| HTTPS | 443 | 0.0.0.0/0 | Public app + Grafana traffic |
| Custom TCP | 3000 | **Your office IP/32** | Dockploy admin UI (only during initial setup; lock down after) |

Outbound: leave default (allow all) — needed for SES, Atlas, S3, npm, apt.

### 4c. Allocate + associate an Elastic IP

EC2 → Elastic IPs → Allocate → Associate to your instance.

**This is the IP you'll use for DNS records and Atlas allowlist.** Note it down: e.g. `13.232.45.67`.

---

## 5. Configure DNS

In your DNS provider (Cloudflare, Route 53, etc.), create two A records pointing to the Elastic IP:

```
api.your-domain.com         A    13.232.45.67
grafana.your-domain.com     A    13.232.45.67
```

If you use Cloudflare, set proxy status to **DNS only (grey cloud)** — Cloudflare's proxy interferes with Let's Encrypt HTTP-01 challenge. You can re-enable proxy after Dockploy successfully issues the cert if desired.

Wait 1–5 min for propagation, then verify:
```bash
dig +short api.your-domain.com
dig +short grafana.your-domain.com
# Both should print 13.232.45.67
```

---

## 6. Initial server prep

SSH in:
```bash
ssh -i path/to/your-key.pem ubuntu@13.232.45.67
```

Run these once:
```bash
# Update + reboot if kernel updates installed
sudo apt update && sudo apt upgrade -y
sudo systemctl reboot
# Wait 30s, SSH back in

# Set hostname
sudo hostnamectl set-hostname csat-prod-1

# Increase open file limit (helps Docker + Mongo client + log fan-out)
echo "fs.file-max = 2097152" | sudo tee -a /etc/sysctl.conf
echo "*       soft    nofile  65535" | sudo tee -a /etc/security/limits.conf
echo "*       hard    nofile  65535" | sudo tee -a /etc/security/limits.conf
sudo sysctl -p

# Install basic utilities (Dockploy installer needs curl)
sudo apt install -y curl ca-certificates jq htop
```

---

## 7. Install Dockploy

Dockploy ships a one-line installer that sets up Docker, Traefik, and the Dockploy admin server.

```bash
curl -sSL https://dokploy.com/install.sh | sudo bash
```

This takes ~2 minutes. When it finishes, it prints a URL like:
```
Dokploy is now available at:  http://13.232.45.67:3000
```

Open that URL in your browser. You'll see the **Setup** screen.

### 7a. Initial admin user

Create the first admin account. Use a strong password — this account can deploy/destroy anything.

Save the password in your team's password manager.

### 7b. Lock down port 3000 once you're in

After confirming you can log in, edit your AWS security group → remove the `:3000` rule entirely. The Dockploy UI will then only be reachable through Traefik on a domain (configured next).

### 7c. Set up the Dockploy admin domain (optional but recommended)

If you want `dockploy.your-domain.com` instead of `:3000`:

1. Add another A record `dockploy.your-domain.com → 13.232.45.67`
2. Dockploy UI → Settings → Server Domain → enter `dockploy.your-domain.com`
3. Dockploy issues TLS automatically; once it works, hit https://dockploy.your-domain.com

### 7d. Confirm Traefik network exists

```bash
docker network ls | grep dokploy-network
# Expected: dokploy-network   bridge   local
```

---

## 8. Connect the repo to Dockploy

### 8a. Generate a Dockploy SSH key for git

Dockploy → Settings → Git Providers → SSH Key → "Generate" → copy the public key.

### 8b. Add the key to GitHub

GitHub → repo Settings → Deploy keys → Add deploy key → paste it. **Read-only is enough.**

### 8c. Verify connection

Back in Dockploy → Settings → Git Providers → "Test connection". Should succeed.

---

## 9. Deploy the observability stack first

The app stack joins `obs-net` (created by the obs stack), so **obs MUST be up first.**

### 9a. Create the obs project

Dockploy → Create Project → name `csat-observability`.

Inside the project → "Create Application" → choose **Docker Compose**:

| Field | Value |
|---|---|
| Name | `obs-stack` |
| Source type | Git |
| Repository URL | `git@github.com:Schbang-Labs/csat-main-server.git` |
| Branch | `main` |
| **Compose path** | `infra/observability`  ⚠️ **directory, NOT the .yml file** |
| Build path | `.` (repo root) |

> **Heads up — common Dockploy gotcha**: the "Compose path" field expects a **directory** containing `docker-compose.yml`, not the compose file itself. If you set `infra/observability/docker-compose.yml` you'll see `cannot create .../docker-compose.yml/.env: Directory nonexistent` because Dockploy `cd`s into the path then writes `.env` there.

### 9b. Configure environment

In the same Application → "Environment" tab → paste:

```bash
# Bind interface — let Traefik route, no need to expose to host
OBS_BIND_IP=127.0.0.1

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<long-random-password-from-pwmgr>
GRAFANA_PORT=3001

# Ports (bound to localhost — Traefik covers public access)
VM_PORT=8428
VLOGS_PORT=9428
ALERTMANAGER_PORT=9093
VMALERT_PORT=8880

# MinIO root (Tempo's S3 backend) — generate fresh, NOT the placeholder
MINIO_ROOT_USER=tempo_user
MINIO_ROOT_PASSWORD=<openssl rand -base64 32>

# AWS SES via SMTP — for Alertmanager
SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=<your IAM access key ID>
SMTP_PASSWORD=<derive from new IAM secret + region using script in .env.runtime>
SMTP_FROM=secondbrain@schbanglabs.com
SMTP_REQUIRE_TLS=true
ALERT_EMAIL_CRITICAL=oncall@schbang.com
ALERT_EMAIL_WARNING=devops@schbang.com
```

> **Important**: when you change `MINIO_ROOT_PASSWORD` from the placeholder, you ALSO need to update `s3.secret_key` in [`infra/tempo/tempo.yaml`](tempo/tempo.yaml) — Tempo authenticates to MinIO with that pair. Either commit the change or use a future improvement to template tempo.yaml the same way we template alertmanager.yaml. For now, simplest path: keep MINIO_ROOT_PASSWORD = the value baked into tempo.yaml (`tempo_password_change_me`) but rotate both at once after first deploy.

### 9c. Deploy

Click **Deploy**. Dockploy:
1. Clones the repo
2. Runs `docker compose -f infra/observability/docker-compose.yml up -d`
3. Streams logs in the UI

Watch for:
- `minio-init` exits 0 (creates the `tempo` bucket)
- `alertmanager-init` exits 0 (renders the SMTP config)
- All long-running containers reach Running state

This takes 3–5 minutes on first deploy (image pulls).

### 9d. Quick sanity inside the VPS

SSH back into the EC2 box:
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
# Expect 9 obs services + dokploy-traefik
```

---

## 10. Deploy the CSAT backend

### 10a. Create the app project

Dockploy → Create Project → `csat-app`.

Inside → Create Application → **Docker Compose**:

| Field | Value |
|---|---|
| Name | `csat-backend` |
| Source type | Git |
| Repository URL | (same repo) |
| Branch | `main` |
| **Compose path** | `.`  (repo root — `docker-compose.yml` sits there) |
| Build path | `.` |

### 10b. Environment

```bash
NODE_ENV=production
HOST_PORT=8080

# MongoDB Atlas — use ROTATED password
MONGO_URI=mongodb+srv://wa_db_user:<NEW_PASSWORD>@cluster0.lpwhlrz.mongodb.net/?appName=Cluster0
JWT_SECRET=<NEW_RANDOM_SECRET>

LOG_LEVEL=info
FRONTEND_URL=["https://secondbrain.schbanglabs.com","https://secondbrain-preview.schbanglabs.com","https://secondbrain-dev.schbanglabs.com"]

# AWS — rotated keys
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<NEW_AKIA>
AWS_SECRET_ACCESS_KEY=<NEW_SECRET>
AWS_BUCKET_NAME=csat-db-backup

# App-side SES (for in-app emails)
SES_FROM_EMAIL=secondbrain@schbanglabs.com
SES_TO_EMAILS=...
SES_ALERTS_ENABLED=true
SES_CONFIGURATION_SET=my-first-configuration-set

# Other
APP_SECRET=<NEW_RANDOM_SECRET>
ADMIN_CLIENT_SECRET=<NEW_RANDOM_SECRET>
OPENROUTER_API_KEY=<NEW_KEY>
MONITOR_SECRET=<NEW_RANDOM_SECRET>
```

### 10c. Deploy + watch

Click Deploy. First build takes ~5 min (npm install, mongodb-tools install). Watch logs for `✓ CSAT Server is ready!`.

---

## 11. Configure HTTPS via Dockploy

### 11a. Backend domain

In the `csat-backend` Application → **Domains** tab → Add Domain:

| Field | Value |
|---|---|
| Host | `api.your-domain.com` |
| Path | `/` |
| Container Port | `8080` |
| HTTPS | ✅ enable |
| Certificate Type | Let's Encrypt |

Click Save. Dockploy adds the right Traefik labels and Let's Encrypt issues a cert (~30 sec).

Verify:
```bash
curl -sf https://api.your-domain.com/health | jq .
# {"status":"OK","uptime":...,"service":"CSAT Server","version":"1.0.0"}
```

### 11b. Grafana domain

In the `obs-stack` Application → Services → `grafana` → Domains tab → Add Domain:

| Field | Value |
|---|---|
| Host | `grafana.your-domain.com` |
| Container Port | `3000` |
| HTTPS | ✅ |
| Certificate Type | Let's Encrypt |

After the cert issues, hit https://grafana.your-domain.com — login with admin / your `GRAFANA_ADMIN_PASSWORD`.

### 11c. Lock down the localhost ports (optional cleanup)

Now that Traefik handles public access, you can safely leave `OBS_BIND_IP=127.0.0.1`. The host port mappings on `127.0.0.1:8428`, `127.0.0.1:9093` etc. are only reachable via SSH tunnel, which is fine for debugging.

---

## 12. Post-deploy verification

Run all of these from your local machine:

### Backend
```bash
curl -sf https://api.your-domain.com/health | jq .status
# "OK"

curl -sf https://api.your-domain.com/api-docs.json | jq '.info.title'
# Whatever your swagger title is
```

### Grafana
1. Open https://grafana.your-domain.com → log in
2. Connections → Data sources → confirm 3 healthy: VictoriaMetrics, VictoriaLogs, Tempo
3. Dashboards → CSAT folder → all 3 dashboards render

### Metrics flowing
Generate traffic, then check:
```bash
for i in {1..20}; do curl -s -o /dev/null https://api.your-domain.com/api/v1/health; done
sleep 25
# In Grafana: Backend Service Overview dashboard should show req/s > 0
```

### Logs flowing
```bash
# Trigger a 404
curl -s https://api.your-domain.com/api/v1/nonexistent
sleep 18
# In Grafana: HTTP Error Logs dashboard should show the warn line
```

### Traces flowing
1. Hit any real endpoint
2. Grafana → Explore → Tempo → Search → service.name = csat-server → click any trace
3. Span tree renders with HTTP + middleware + (if route hit DB) mongoose spans

### Alerts wired
1. SSH into the EC2 box
2. `docker stop csat-backend`
3. Wait 2.5 min
4. **Email arrives** at `ALERT_EMAIL_CRITICAL` with subject `[CRITICAL] ServiceDown on csat-server`
5. `docker start csat-backend` — within 1 min you get `[RESOLVED]` email

### Cleanup TestPing
```bash
# In your local repo
rm infra/vmalert/rules/test.yaml
git commit -am "chore: remove TestPing alert rule after SES verified"
git push
```
Dockploy auto-redeploys on push (if you enabled the webhook) OR click Redeploy in the UI. TestPing will resolve and stop firing.

---

## 13. Day-2 operations

### Backups

Already automated via the monthly cron in [src/config/cron.js](../src/config/cron.js):
- Runs 1st of every month at 20:40 IST
- `mongodump` → tar → upload to `s3://csat-db-backup/`
- Failure → CronBackupMissed alert fires after 35d of no success

### Updates

To pull latest changes:
1. `git push` to main
2. Dockploy → app → Redeploy
3. (Or set up a webhook so push auto-deploys — Phase 5)

### Volume backups

The obs stack volumes live on the EC2 EBS volume:
- `vm-data` — 90d of metrics
- `vlogs-data` — 30d of logs
- `tempo-data` + `minio-data` — 7d of traces
- `grafana-data` — dashboards, users, settings (small)

Snapshot the entire EBS volume nightly via AWS Backup or a Lambda + EventBridge cron.

### Scaling

When you outgrow t3.large:
1. Stop instance → Modify instance type → t3.xlarge → Start
2. Bump the per-service `mem_limit` values in [infra/observability/docker-compose.yml](observability/docker-compose.yml) accordingly

When you outgrow a single VPS:
- Move obs stack to its own EC2; keep backend on its own
- Change `OTEL_EXPORTER_OTLP_ENDPOINT` on the app to point at the new collector via Tailscale or VPC peering
- Whole architecture supports this — already documented in the original plan

---

## 14. Troubleshooting

### Dockploy can't pull the repo

Check the deploy key in GitHub → Settings → Deploy keys is the same one shown in Dockploy → Settings → Git Providers.

### `obs-net declared as external, but could not be found`

You deployed the app stack before the obs stack. Deploy `obs-stack` first.

### Mongo Atlas connection times out

The EC2 IP isn't allowlisted. Atlas → Network Access → Add IP → enter the Elastic IP.

### No alert emails arriving

In order:
1. Alertmanager UI (`https://grafana.your-domain.com` won't work for this — SSH tunnel: `ssh -L 9093:127.0.0.1:9093 ubuntu@<EIP>` then http://localhost:9093) — check the alert is firing, not silenced
2. Alertmanager logs: `docker logs alertmanager 2>&1 | grep -iE "smtp|error"`
3. Common: SES sandbox + recipient unverified → fix in SES Console
4. Common: SMTP_PASSWORD outdated after AWS_SECRET rotation → re-derive

### Container OOM-killed

`docker stats` to identify the killer. Bump that service's `mem_limit` in compose, redeploy.

### Disk fill

```bash
df -h /
docker system df
```
Likely culprits in order: VictoriaMetrics, VictoriaLogs, MinIO (Tempo blocks). Reduce retention in their respective compose `command:` args, redeploy, then `docker exec <vm|vlogs> /victoria-metrics-prod -storageDataPath=/storage -force-cleanup` to reclaim space. Or grow the EBS volume.

### Root volume too small (default 8 GB AMI)

Symptoms during first deploy: `no space left on device` while Docker pulls images, `df -h` shows `/dev/root` at ~7 GB and 100% full.

Fix:
1. AWS Console → EC2 → Volumes → Modify the attached volume → set to 50 GB
2. SSH in:
   ```bash
   sudo apt install -y cloud-guest-utils
   sudo growpart /dev/nvme0n1 1
   df -T /                          # check fs type
   sudo resize2fs /dev/nvme0n1p1    # if ext4
   # or: sudo xfs_growfs /          # if xfs
   df -h /                          # confirm new size
   ```
3. `sudo docker system prune -af` to clean partial pulls
4. Redeploy from Dockploy

### TLS cert won't issue

- Cloudflare proxy turned on → turn it off (DNS-only mode)
- Port 80 not open in security group → fix
- DNS hasn't propagated → wait 5–10 min, retry from Dockploy UI

### Need to rotate SMTP_PASSWORD after AWS key rotation

Run the derivation script (see [.env.runtime](../.env.runtime) header comment for the Python snippet). Update `SMTP_PASSWORD` in Dockploy env → Restart `alertmanager-init` + `alertmanager`.

---

## Done

You should now have a fully observable, alerting-enabled CSAT backend in production behind HTTPS. Bookmark:

- App: `https://api.your-domain.com`
- Grafana: `https://grafana.your-domain.com`
- Dockploy admin: `https://dockploy.your-domain.com` (or `:3000` via SSH tunnel)
- Alertmanager: SSH tunnel `ssh -L 9093:127.0.0.1:9093 ubuntu@<EIP>` → http://localhost:9093
- VMAlert: SSH tunnel `ssh -L 8880:127.0.0.1:8880 ubuntu@<EIP>` → http://localhost:8880

Phase 5 (CI/CD via Dockploy git webhook + tagged image deploys) is a small follow-up on top of this.
