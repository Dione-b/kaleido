#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$ROOT_DIR/node_modules/.bin:$PATH"

APP_NAME="${1:-smoke-app}"
IDENTITY_ALIAS="${KALEIDO_CI_IDENTITY_ALIAS:?KALEIDO_CI_IDENTITY_ALIAS is required}"

rm -rf "$APP_NAME"

kaleido --version
stellar --version
kaleido init "$APP_NAME" --template react-vite-counter
cd "$APP_NAME"

kaleido build counter
kaleido deploy counter --network testnet --source "$IDENTITY_ALIAS"

test -f kaleido.artifacts.json
node --input-type=module -e '
import fs from "node:fs";
const artifacts = JSON.parse(fs.readFileSync("kaleido.artifacts.json", "utf8"));
const contractId = artifacts.networks?.testnet?.contracts?.counter?.contractId;
if (!/^C[A-Z0-9]{55}$/.test(contractId ?? "")) {
  console.error(`Invalid contractId: ${contractId}`);
  process.exit(1);
}
'

kaleido generate counter --network testnet
test -d src/contracts/generated

kaleido invoke counter.increment --network testnet --source "$IDENTITY_ALIAS"
