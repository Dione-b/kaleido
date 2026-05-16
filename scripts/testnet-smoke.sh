#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$ROOT_DIR/node_modules/.bin:$PATH"
CORE_INDEX="${ROOT_DIR}/packages/core/dist/index.js"

APP_NAME="${1:-smoke-app}"
IDENTITY_ALIAS="${CAATINGA_CI_IDENTITY_ALIAS:?CAATINGA_CI_IDENTITY_ALIAS is required}"
ARTIFACT_DIR="$ROOT_DIR/smoke-ci-out"
LOG_FILE="$ARTIFACT_DIR/${APP_NAME}-smoke.log"
CAATINGA_VERSION_FILE="$ARTIFACT_DIR/${APP_NAME}-caatinga-version.txt"
STELLAR_VERSION_FILE="$ARTIFACT_DIR/${APP_NAME}-stellar-version.txt"

mkdir -p "$ARTIFACT_DIR"
: > "$LOG_FILE"

log() {
  { echo "[$(date -Iseconds)] $*"; } | tee -a "$LOG_FILE"
}

classify_and_exit() {
  local ec="$1"
  local title="$2"
  log "Step failed: ${title} (exit ${ec})"
  if node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { isTransientTestnetSmokeFailure } from '${CORE_INDEX}';
const log = readFileSync(process.argv[1], 'utf8');
process.exit(isTransientTestnetSmokeFailure(log) ? 0 : 1);
" "$LOG_FILE"; then
    if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
      echo "transient=true" >> "$GITHUB_OUTPUT"
    fi
    exit 2
  fi
  exit 1
}

run_step() {
  local title="$1"
  shift
  log "=== ${title} ==="
  set +e
  { "$@" 2>&1; } | tee -a "$LOG_FILE"
  local ec=${PIPESTATUS[0]}
  set -e
  if [[ "$ec" -ne 0 ]]; then
    classify_and_exit "$ec" "$title"
  fi
}

log "=== caatinga-version ==="
set +e
caatinga --version 2>&1 | tee "$CAATINGA_VERSION_FILE" | tee -a "$LOG_FILE"
ec_kv=${PIPESTATUS[0]}
set -e
if [[ "$ec_kv" -ne 0 ]]; then
  classify_and_exit "$ec_kv" "caatinga-version"
fi

log "=== stellar-version ==="
set +e
stellar --version 2>&1 | tee "$STELLAR_VERSION_FILE" | tee -a "$LOG_FILE"
ec_sv=${PIPESTATUS[0]}
set -e
if [[ "$ec_sv" -ne 0 ]]; then
  classify_and_exit "$ec_sv" "stellar-version"
fi

rm -rf "$ROOT_DIR/$APP_NAME"

run_step "init" caatinga init "$APP_NAME" --template react-vite-counter
cd "$ROOT_DIR/$APP_NAME"

run_step "build" caatinga build counter
run_step "deploy" caatinga deploy counter --network testnet --source "$IDENTITY_ALIAS"

test -f caatinga.artifacts.json

log "=== artifacts-contract-id ==="
set +e
node --input-type=module -e '
import fs from "node:fs";
const artifacts = JSON.parse(fs.readFileSync("caatinga.artifacts.json", "utf8"));
const contractId = artifacts.networks?.testnet?.contracts?.counter?.contractId;
if (!/^C[A-Z0-9]{55}$/.test(contractId ?? "")) {
  console.error(`Invalid contractId: ${contractId}`);
  process.exit(1);
}
' 2>&1 | tee -a "$LOG_FILE"
ec_art=${PIPESTATUS[0]}
set -e
if [[ "$ec_art" -ne 0 ]]; then
  classify_and_exit "$ec_art" "artifacts-contract-id"
fi

run_step "generate" caatinga generate counter --network testnet
test -d src/contracts/generated

set +e
INVOKE_OUT="$(mktemp)"
caatinga invoke counter.increment --network testnet --source "$IDENTITY_ALIAS" 2>&1 | tee "$INVOKE_OUT" | tee -a "$LOG_FILE"
INV_EC=${PIPESTATUS[0]}
set -e
if [[ "$INV_EC" -ne 0 ]]; then
  classify_and_exit "$INV_EC" "invoke"
fi
if ! grep -q "Invoke complete" "$INVOKE_OUT"; then
  echo "invoke output missing success marker" | tee -a "$LOG_FILE"
  classify_and_exit 1 "invoke-assert"
fi
rm -f "$INVOKE_OUT"

log "=== smoke complete ==="
exit 0
