#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

if [[ -z "${BACKUP_FILE:-}" ]]; then
  echo "BACKUP_FILE is required. Example: BACKUP_FILE=./backups/studyflow_20260805T120000Z.dump ./scripts/restore.sh" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [[ "${CONFIRM_RESTORE:-}" != "yes" ]]; then
  echo "Restore is destructive. Set CONFIRM_RESTORE=yes to continue." >&2
  exit 1
fi

DB_SERVICE="${DB_SERVICE:-db}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/docker-compose.yml}"

if command -v pg_restore >/dev/null 2>&1; then
  pg_restore \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --dbname="${DATABASE_URL}" \
    "${BACKUP_FILE}"
else
  command -v docker >/dev/null 2>&1 || {
    echo "pg_restore not found and Docker is unavailable. Install PostgreSQL client or Docker." >&2
    exit 1
  }

  echo "pg_restore not found; using PostgreSQL client from Docker service '${DB_SERVICE}'." >&2
  docker compose -f "${COMPOSE_FILE}" exec -T "${DB_SERVICE}" \
    sh -c 'pg_restore --clean --if-exists --no-owner --no-acl --dbname="$POSTGRES_DB"' \
    < "${BACKUP_FILE}"
fi

echo "Restore completed from: ${BACKUP_FILE}"
