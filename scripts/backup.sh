#!/usr/bin/env bash
# ==============================================================
# CosmoFolio Automated Backup Script
# Phase 7: Task 7.5 — Database & asset backup to S3
# Cron: 0 2 * * * /opt/cosmofolio/scripts/backup.sh production
# ==============================================================

set -euo pipefail

ENVIRONMENT="${1:-production}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/cosmofolio_backups"
S3_BUCKET="${S3_BACKUP_BUCKET:-cosmofolio-backups}"
RETENTION_DAYS=30

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

log()   { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

mkdir -p "$BACKUP_DIR"

# ==============================================================
# DATABASE BACKUP
# ==============================================================

backup_database() {
    log "Backing up PostgreSQL database..."

    local filename="cosmofolio_db_${ENVIRONMENT}_${DATE}.sql.gz"
    local filepath="$BACKUP_DIR/$filename"

    # Dump and compress
    pg_dump "$DATABASE_URL" | gzip > "$filepath"

    local size
    size=$(du -sh "$filepath" | cut -f1)
    ok "Database backup: $filename ($size)"

    # Upload to S3
    if command -v aws >/dev/null 2>&1; then
        aws s3 cp "$filepath" "s3://$S3_BUCKET/database/$filename" \
            --storage-class STANDARD_IA
        ok "Uploaded to S3: s3://$S3_BUCKET/database/$filename"
    else
        log "AWS CLI not available — backup stored locally at $filepath"
    fi
}

# ==============================================================
# REDIS BACKUP
# ==============================================================

backup_redis() {
    log "Backing up Redis data..."

    local filename="cosmofolio_redis_${ENVIRONMENT}_${DATE}.rdb"
    local filepath="$BACKUP_DIR/$filename"

    # Trigger BGSAVE and wait
    redis-cli -u "$REDIS_URL" BGSAVE
    sleep 5

    # Copy RDB file
    redis-cli -u "$REDIS_URL" --rdb "$filepath" 2>/dev/null || \
        log "Redis RDB copy skipped (may not be accessible)"

    if [[ -f "$filepath" ]]; then
        local size
        size=$(du -sh "$filepath" | cut -f1)
        ok "Redis backup: $filename ($size)"

        if command -v aws >/dev/null 2>&1; then
            aws s3 cp "$filepath" "s3://$S3_BUCKET/redis/$filename"
            ok "Uploaded Redis backup to S3"
        fi
    fi
}

# ==============================================================
# CLEANUP OLD BACKUPS
# ==============================================================

cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    # Local cleanup
    find "$BACKUP_DIR" -name "cosmofolio_*" -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true

    # S3 lifecycle policies handle remote cleanup automatically
    ok "Local cleanup complete"
}

# ==============================================================
# VERIFY BACKUP
# ==============================================================

verify_backup() {
    log "Verifying latest database backup..."

    local latest
    latest=$(ls -t "$BACKUP_DIR"/cosmofolio_db_*.sql.gz 2>/dev/null | head -1)

    if [[ -z "$latest" ]]; then
        error "No backup file found to verify"
    fi

    # Check file is not empty and valid gzip
    if [[ -s "$latest" ]] && gzip -t "$latest" 2>/dev/null; then
        local line_count
        line_count=$(zcat "$latest" | wc -l)
        ok "Backup verified: $latest ($line_count lines)"
    else
        error "Backup verification failed: $latest"
    fi
}

# ==============================================================
# NOTIFY
# ==============================================================

notify() {
    local status="$1"
    local message="$2"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-type: application/json" \
            -d "{\"text\": \"CosmoFolio Backup [$ENVIRONMENT]: $status — $message\"}" \
            >/dev/null
    fi

    if [[ -n "${NOTIFY_EMAIL:-}" ]]; then
        echo "$message" | mail -s "CosmoFolio Backup $status [$ENVIRONMENT]" "$NOTIFY_EMAIL" 2>/dev/null || true
    fi
}

# ==============================================================
# MAIN
# ==============================================================

main() {
    log "=== CosmoFolio Backup — $ENVIRONMENT ($DATE) ==="

    backup_database
    backup_redis
    verify_backup
    cleanup_old_backups

    notify "SUCCESS" "Backup completed at $(date '+%Y-%m-%d %H:%M:%S')"
    ok "=== Backup complete ==="
}

main "$@"
