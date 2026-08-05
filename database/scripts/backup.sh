#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
BACKUP_FILE="${BACKUP_DIR}/studyflow_${TIMESTAMP}.dump"
DB_SERVICE="${DB_SERVICE:-db}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/docker-compose.yml}"

mkdir -p "${BACKUP_DIR}"

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump \
    --format=custom \
    --no-owner \
    --no-acl \
    --file="${BACKUP_FILE}" \
    "${DATABASE_URL}"
else
  command -v docker >/dev/null 2>&1 || {
    echo "pg_dump not found and Docker is unavailable. Install PostgreSQL client or Docker." >&2
    exit 1
  }

  echo "pg_dump not found; using PostgreSQL client from Docker service '${DB_SERVICE}'." >&2
  docker compose -f "${COMPOSE_FILE}" exec -T "${DB_SERVICE}" \
    sh -c 'pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --no-owner --no-acl' \
    > "${BACKUP_FILE}"
fi

echo "Backup created: ${BACKUP_FILE}"
