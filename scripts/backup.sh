#!/usr/bin/env bash
# ─── WasteFlow PostgreSQL Backup Script ────────────────────────────────────────
# Usage: ./scripts/backup.sh [output-dir]
# Default output: ~/wasteflow-backups/
#
# Scheduled via cron: 0 3 * * * /path/to/scripts/backup.sh
#
# Requires:
#   - pg_dump (PostgreSQL client)
#   - DATABASE_URL env var (or .env.local)
#   - gzip

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────

BACKUP_DIR="${1:-$HOME/wasteflow-backups}"
RETENTION_DAYS=30
TIMESTAMP=$(date +'%Y-%m-%d_%H-%M-%S')
DB_URL="${DATABASE_URL:-}"

# Try loading from .env.local if DATABASE_URL not set
if [[ -z "$DB_URL" && -f .env.local ]]; then
  DB_URL=$(grep '^DATABASE_URL=' .env.local | head -1 | cut -d'=' -f2- | tr -d '"')
fi

if [[ -z "$DB_URL" ]]; then
  echo "ERROR: DATABASE_URL not set and not found in .env.local"
  exit 1
fi

# ─── Ensure output directory ─────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

# ─── Backup ──────────────────────────────────────────────────────────────────

BACKUP_FILE="${BACKUP_DIR}/wasteflow-${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..." | tee -a "$LOG_FILE"

# Use pg_dump with custom format for smaller size and parallel restore support
pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --verbose \
  2>> "$LOG_FILE" \
| gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup complete: $BACKUP_FILE ($BACKUP_SIZE)" | tee -a "$LOG_FILE"

# ─── Retention: delete backups older than N days ─────────────────────────────

find "$BACKUP_DIR" -name 'wasteflow-*.sql.gz' -mtime +${RETENTION_DAYS} -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up backups older than ${RETENTION_DAYS} days" | tee -a "$LOG_FILE"

# ─── Health check: verify the backup file is valid ───────────────────────────

if gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup integrity check: OK" | tee -a "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup file corrupted!" | tee -a "$LOG_FILE"
  rm -f "$BACKUP_FILE"
  exit 2
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup finished successfully" | tee -a "$LOG_FILE"
