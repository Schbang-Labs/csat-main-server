# ============================================================
# CSAT Backend — local dev orchestration
# ------------------------------------------------------------
# Two compose stacks live in this repo:
#   - infra/observability/docker-compose.yml   (otel-collector, vm, vlogs,
#                                               tempo+minio, grafana, alerts)
#   - docker-compose.yml                       (csat-backend app)
#
# Boot order matters: the observability stack OWNS the `obs-net` docker
# network; the app stack joins it as `external`. Bringing the app up
# first errors with `network obs-net not found`. Every "up" target here
# enforces the right order.
#
# Run `make help` (or just `make`) for the target list.
# ============================================================

# Use bash for `set -e`, `[[ ... ]]`, etc.
SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c

# Compose files
APP_COMPOSE := docker-compose.yml
OBS_COMPOSE := infra/observability/docker-compose.yml

# Project names — kept aligned with the defaults `docker compose` derives
# from each compose file's directory (`csat-main-server` for the repo-root
# app stack, `observability` for the obs stack). Matching the defaults
# means `make` and bare `docker compose -f ... up` both target the same
# containers/networks/volumes — no conflicts when switching between them.
APP_PROJECT := csat-main-server
OBS_PROJECT := observability

# `docker compose` (v2) shorthand
DC := docker compose

# Dockploy creates `dokploy-network` in production. On local dev it doesn't
# exist — both stacks declare it `external`, which causes a startup error
# unless we create a no-op bridge with the same name. The `ensure-networks`
# target is idempotent and safe to re-run.
DOKPLOY_NET := dokploy-network

.DEFAULT_GOAL := help

.PHONY: help dev up down restart logs ps build rebuild reload \
        obs-up obs-down obs-logs obs-ps \
        app-up app-down app-logs app-ps \
        ensure-networks clean nuke status urls

## --- Headline target ---------------------------------------------------

dev: ensure-networks obs-up app-up status urls ## Bring up obs + app stacks (full local dev environment)

## --- Composite (both stacks) -------------------------------------------

up: dev ## Alias for `make dev`

down: app-down obs-down ## Stop and remove containers from BOTH stacks

restart: down dev ## Full restart of both stacks

ps: ## Show container status across both stacks
	@echo "── observability ──────────────────────────────────────────"
	@$(DC) -p $(OBS_PROJECT) -f $(OBS_COMPOSE) ps || true
	@echo
	@echo "── app ────────────────────────────────────────────────────"
	@$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) ps || true

logs: ## Tail logs from BOTH stacks (Ctrl-C to stop)
	@$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) \
	       -p $(OBS_PROJECT) -f $(OBS_COMPOSE) logs -f --tail=50 || \
	  ( $(MAKE) app-logs )

## --- Observability stack -----------------------------------------------

obs-up: ensure-networks ## Start observability stack only (otel/vm/vlogs/tempo/grafana)
	@echo "▶ Starting observability stack..."
	$(DC) -p $(OBS_PROJECT) -f $(OBS_COMPOSE) up -d
	@echo "✔ Observability stack is up."

obs-down: ## Stop observability stack
	@echo "▶ Stopping observability stack..."
	-$(DC) -p $(OBS_PROJECT) -f $(OBS_COMPOSE) down
	@echo "✔ Observability stack is down."

obs-logs: ## Tail observability logs
	$(DC) -p $(OBS_PROJECT) -f $(OBS_COMPOSE) logs -f --tail=100

obs-ps: ## Status of observability containers
	$(DC) -p $(OBS_PROJECT) -f $(OBS_COMPOSE) ps

## --- App stack ---------------------------------------------------------

app-up: ensure-networks ## Start app stack (rebuilds image if src/ changed; assumes obs is up)
	@if ! docker network inspect obs-net >/dev/null 2>&1; then \
	  echo "✖ obs-net not found — run 'make obs-up' (or 'make dev') first."; \
	  exit 1; \
	fi
	@echo "▶ Starting app stack (rebuilding if src changed)..."
	# `--build` rebuilds the image when its build context (src/, package.json,
	# Dockerfile) changed. Without this, `make dev` would silently keep the
	# previous image and run stale code after edits — a footgun we hit once.
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) up -d --build
	@echo "✔ App stack is up."

reload: ensure-networks ## Rebuild + restart ONLY the app (fastest after a code edit)
	@echo "▶ Reloading app..."
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) up -d --build --force-recreate csat-backend
	@echo "✔ App reloaded."

app-down: ## Stop app stack
	@echo "▶ Stopping app stack..."
	-$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) down
	@echo "✔ App stack is down."

app-logs: ## Tail app logs
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) logs -f --tail=100

app-ps: ## Status of app containers
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) ps

build: ## Build the app image
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) build

rebuild: ## Rebuild the app image without cache and restart it
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) build --no-cache
	$(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) up -d --force-recreate

## --- Helpers -----------------------------------------------------------

ensure-networks: ## Create local stand-ins for external networks (idempotent)
	@if ! docker network inspect $(DOKPLOY_NET) >/dev/null 2>&1; then \
	  echo "▶ Creating local placeholder for $(DOKPLOY_NET) (Dockploy not installed)..."; \
	  docker network create $(DOKPLOY_NET) >/dev/null; \
	fi

status: ## Pretty status header (printed at end of `make dev`)
	@echo
	@echo "═══════════════════════════════════════════════════════════"
	@echo " CSAT local dev — running"
	@echo "═══════════════════════════════════════════════════════════"
	@$(MAKE) --no-print-directory ps

urls: ## Print the URLs you'll actually use
	@echo
	@echo "── URLs ───────────────────────────────────────────────────"
	@echo "  API           http://localhost:$${HOST_PORT:-8080}"
	@echo "  API health    http://localhost:$${HOST_PORT:-8080}/health"
	@echo "  Grafana       http://localhost:3001   (admin / admin)"
	@echo "  VictoriaLogs  http://localhost:9428"
	@echo "  VictoriaMetr. http://localhost:8428"
	@echo "  vmalert       http://localhost:8880"
	@echo "  Alertmanager  http://localhost:9093"
	@echo "  Tempo         (internal only — query via Grafana)"
	@echo "═══════════════════════════════════════════════════════════"

## --- Destructive (require explicit confirmation) -----------------------

clean: ## Stop both stacks and remove their named volumes (DESTRUCTIVE)
	@read -r -p "This deletes Grafana/VM/VLogs/Tempo/MinIO data. Continue? [y/N] " ans; \
	if [[ "$$ans" =~ ^[Yy]$$ ]]; then \
	  $(DC) -p $(APP_PROJECT) -f $(APP_COMPOSE) down -v; \
	  $(DC) -p $(OBS_PROJECT) -f $(OBS_COMPOSE) down -v; \
	  echo "✔ Cleaned."; \
	else \
	  echo "Aborted."; \
	fi

nuke: clean ## Alias for `make clean` (DESTRUCTIVE)

## --- Help --------------------------------------------------------------

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
	     /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } \
	     /^##/ { printf "\n%s\n", substr($$0, 4) }' $(MAKEFILE_LIST)
