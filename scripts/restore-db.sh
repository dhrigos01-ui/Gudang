#!/usr/bin/env bash
set -euo pipefail

# Usage: bash scripts/restore-db.sh ./backups/backup_YYYYMMDD_HHMMSS.sql

FILE=${1:-}
if [[ -z "$FILE" ]]; then
  echo "Usage: bash scripts/restore-db.sh <path-to-backup.sql>" >&2
  exit 1
fi

if [[ ! -f "$FILE" ]]; then
  echo "File tidak ditemukan: $FILE" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | xargs)
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL tidak ditemukan. Set env atau .env terlebih dahulu." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql tidak ditemukan di PATH." >&2
  exit 1
fi

echo "PERINGATAN: Proses restore akan mengeksekusi SQL pada database tujuan. Pastikan database benar." >&2
read -p "Tekan Enter untuk melanjutkan, Ctrl+C untuk batal..." _

echo "Melakukan restore dari $FILE ..."
psql "$DATABASE_URL" -f "$FILE"

echo "Restore selesai."

