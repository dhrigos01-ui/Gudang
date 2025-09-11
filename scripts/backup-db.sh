#!/usr/bin/env bash
set -euo pipefail

# Requires: pg_dump installed and DATABASE_URL set (.env)

OUT_DIR=${1:-backups}
mkdir -p "$OUT_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | xargs)
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL tidak ditemukan. Set env atau .env terlebih dahulu." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump tidak ditemukan di PATH." >&2
  exit 1
fi

TS=$(date +%Y%m%d_%H%M%S)
FILE="$OUT_DIR/backup_${TS}.sql"

echo "Membuat backup ke $FILE ..."
pg_dump --no-owner --no-privileges --format=plain --dbname="$DATABASE_URL" > "$FILE"

echo "Backup selesai: $FILE"

