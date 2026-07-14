#!/usr/bin/env bash
#
# Local PostgreSQL backup — pg_dump → gzip → ./backups, with age-based pruning.
#
# The Risk Register in docs/migration-roadmap.md rates "PostgreSQL data loss before
# backup is set up" as Critical impact, so this exists ahead of the full S3/R2
# pipeline (Phase 5). It is deliberately dumb: one host, one directory, no network.
#
# Usage:
#   ./scripts/backup-db.sh                 # dump the dockerised dev database
#   BACKUP_DIR=/mnt/x ./scripts/backup-db.sh
#   RETENTION_DAYS=30 ./scripts/backup-db.sh
#
# Cron (daily at 02:00), from the repo root:
#   0 2 * * * cd /path/to/ats-platform && ./scripts/backup-db.sh >> backups/backup.log 2>&1
#
# SAFETY: this only ever READS the database. It never restores, drops, or migrates.
# Restoring is a deliberate, manual act — see the note at the bottom.

set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-ats-postgres}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "error: container '$CONTAINER' is not running — start it with:" >&2
  echo "  docker-compose -f docker-compose-dev.yml up -d postgres" >&2
  exit 1
fi

# Read the credentials from the container's own environment rather than from .env,
# so the secret never has to be handled (or logged) by this script.
DB_USER="$(docker exec "$CONTAINER" printenv POSTGRES_USER)"
DB_NAME="$(docker exec "$CONTAINER" printenv POSTGRES_DB)"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTFILE="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.sql.gz"

echo "Backing up '$DB_NAME' from container '$CONTAINER' → $OUTFILE"

# --clean --if-exists so the dump can be replayed onto a non-empty database.
# Pipe straight to gzip: never leave an uncompressed dump on disk.
docker exec "$CONTAINER" pg_dump \
  --username "$DB_USER" \
  --dbname "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  | gzip > "$OUTFILE"

# A zero-byte or header-only file means pg_dump failed while gzip still "succeeded";
# `set -o pipefail` catches most of it, but check the artefact is real before pruning
# older backups on the strength of it.
if [ ! -s "$OUTFILE" ]; then
  echo "error: backup file is empty — refusing to prune old backups" >&2
  rm -f "$OUTFILE"
  exit 1
fi

SIZE="$(du -h "$OUTFILE" | cut -f1)"
echo "OK — wrote $OUTFILE ($SIZE)"

echo "Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete

# To restore (DESTRUCTIVE — overwrites the target database, never run it blind):
#   gunzip -c backups/<file>.sql.gz | docker exec -i ats-postgres psql -U <user> -d <db>
