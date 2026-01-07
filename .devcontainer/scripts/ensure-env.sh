#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.."
ENV_FILE="${REPO_ROOT}/.env.local"
EXAMPLE_FILE="${REPO_ROOT}/.env.local.example"

if [ -f "${ENV_FILE}" ]; then
  exit 0
fi

if [ -f "${EXAMPLE_FILE}" ]; then
  cp "${EXAMPLE_FILE}" "${ENV_FILE}"
else
  touch "${ENV_FILE}"
fi
