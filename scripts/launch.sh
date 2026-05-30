#!/usr/bin/env bash
# ==============================================================
# CosmoFolio Production Launch Script
# Phase 7: Task 7.5 — Deploys and validates the full stack
# Usage: ./scripts/launch.sh [staging|production]
# ==============================================================

set -euo pipefail

ENVIRONMENT="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log()   { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ==============================================================
# PRE-FLIGHT CHECKS
# ==============================================================

preflight() {
    log "Running pre-flight checks for '$ENVIRONMENT'..."

    command -v docker >/dev/null 2>&1   || error "Docker not installed"
    command -v docker-compose >/dev/null 2>&1 || \
        docker compose version >/dev/null 2>&1 || error "Docker Compose not available"
    command -v curl >/dev/null 2>&1     || error "curl not installed"

    [[ -f "$ROOT_DIR/.env" ]] || error ".env file not found. Copy .env.example and fill in values."

    # Required env vars
    local required_vars=(SECRET_KEY DB_PASSWORD REDIS_PASSWORD REPLICATE_API_TOKEN)
    for var in "${required_vars[@]}"; do
        # shellcheck disable=SC1090
        source "$ROOT_DIR/.env"
        [[ -n "${!var:-}" ]] || error "Required environment variable $var is not set in .env"
    done

    ok "Pre-flight checks passed"
}

# ==============================================================
# DATABASE MIGRATION
# ==============================================================

run_migrations() {
    log "Running database migrations..."

    docker compose -f "$ROOT_DIR/docker-compose.yml" \
        exec -T backend \
        python -m alembic upgrade head 2>&1 | tee /tmp/migration.log

    if grep -q "ERROR" /tmp/migration.log 2>/dev/null; then
        error "Migration failed — check /tmp/migration.log"
    fi

    ok "Migrations applied"
}

# ==============================================================
# BUILD & START
# ==============================================================

build_and_start() {
    log "Building Docker images..."

    docker compose -f "$ROOT_DIR/docker-compose.yml" build \
        --no-cache \
        --parallel 2>&1 | grep -E "^(Step|Successfully|ERROR)" || true

    log "Starting services..."
    docker compose -f "$ROOT_DIR/docker-compose.yml" up -d --remove-orphans

    ok "Services started"
}

# ==============================================================
# WAIT FOR SERVICES
# ==============================================================

wait_for_services() {
    log "Waiting for services to become healthy..."

    local max_attempts=30
    local attempt=0
    local services=(backend frontend postgres redis)

    for service in "${services[@]}"; do
        attempt=0
        while [[ $attempt -lt $max_attempts ]]; do
            status=$(docker compose ps --format json "$service" 2>/dev/null \
                | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','unknown'))" 2>/dev/null \
                || echo "unknown")

            if [[ "$status" == "healthy" ]] || docker compose ps "$service" 2>/dev/null | grep -q "Up"; then
                ok "Service '$service' is up"
                break
            fi

            ((attempt++))
            sleep 2
        done

        [[ $attempt -lt $max_attempts ]] || warn "Service '$service' health timeout — continuing"
    done
}

# ==============================================================
# SMOKE TESTS
# ==============================================================

smoke_tests() {
    log "Running smoke tests..."

    local api_url="http://localhost:8000"
    local frontend_url="http://localhost:3000"

    # Backend health
    if curl -sf "$api_url/health" >/dev/null; then
        ok "Backend health check passed"
    else
        error "Backend health check FAILED"
    fi

    # Frontend
    if curl -sf "$frontend_url" >/dev/null; then
        ok "Frontend health check passed"
    else
        warn "Frontend not responding (may still be starting)"
    fi

    # API: unauthenticated
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$api_url/api/portfolios")
    if [[ "$status" == "401" || "$status" == "403" ]]; then
        ok "API auth guard is active (HTTP $status)"
    else
        warn "Unexpected API response: HTTP $status"
    fi

    # Rate limiter headers
    local headers
    headers=$(curl -sI "$api_url/health")
    if echo "$headers" | grep -qi "X-RateLimit"; then
        ok "Rate limit headers present"
    else
        warn "Rate limit headers not found on /health"
    fi

    ok "Smoke tests complete"
}

# ==============================================================
# SSL CERTIFICATE SETUP
# ==============================================================

setup_ssl() {
    if [[ "$ENVIRONMENT" != "production" ]]; then
        log "Skipping SSL setup (not production)"
        return
    fi

    log "Checking SSL certificates..."
    local ssl_dir="$ROOT_DIR/ssl"
    mkdir -p "$ssl_dir"

    if [[ -f "$ssl_dir/fullchain.pem" && -f "$ssl_dir/privkey.pem" ]]; then
        local expiry
        expiry=$(openssl x509 -enddate -noout -in "$ssl_dir/fullchain.pem" 2>/dev/null | cut -d= -f2)
        ok "SSL certificate found (expires: $expiry)"
    else
        warn "SSL certificates not found at $ssl_dir/"
        warn "Run: certbot certonly --standalone -d cosmofolio.com -d api.cosmofolio.com"
        warn "Then copy certs to $ssl_dir/"
    fi
}

# ==============================================================
# CREATE INITIAL SUPERUSER
# ==============================================================

create_superuser() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Skipping auto-superuser creation in production"
        return
    fi

    log "Creating dev superuser (admin@cosmofolio.com / admin123)..."
    docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T backend \
        python -c "
from services.auth import create_superuser
create_superuser('admin@cosmofolio.com', 'admin123', 'Admin User')
print('Superuser created')
" 2>/dev/null && ok "Dev superuser created" || warn "Could not create superuser (may already exist)"
}

# ==============================================================
# PRINT LAUNCH SUMMARY
# ==============================================================

print_summary() {
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}  CosmoFolio is LIVE — $ENVIRONMENT${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo -e "  Frontend  : http://localhost:3000"
    echo -e "  API       : http://localhost:8000"
    echo -e "  API Docs  : http://localhost:8000/docs"
    echo -e "  ReDoc     : http://localhost:8000/redoc"
    echo -e "  Health    : http://localhost:8000/health"
    echo ""
    echo -e "  Logs      : docker compose logs -f"
    echo -e "  Stop      : docker compose down"
    echo ""
    if [[ "$ENVIRONMENT" != "production" ]]; then
        echo -e "  Dev login : admin@cosmofolio.com / admin123"
        echo ""
    fi
    echo -e "${GREEN}============================================================${NC}"
    echo ""
}

# ==============================================================
# MAIN
# ==============================================================

main() {
    echo ""
    log "=== CosmoFolio Launch Script — $ENVIRONMENT ==="
    echo ""

    preflight
    build_and_start
    wait_for_services
    run_migrations
    setup_ssl
    create_superuser
    smoke_tests
    print_summary
}

main "$@"
