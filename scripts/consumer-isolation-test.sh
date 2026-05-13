#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKED_DIR="$ROOT_DIR/packed"
TMP_DIR="${TMPDIR:-/tmp}/kaleido-consumer-test"

rm -rf "$PACKED_DIR" "$TMP_DIR"
mkdir -p "$PACKED_DIR" "$TMP_DIR"

pnpm --dir "$ROOT_DIR" build
( cd "$ROOT_DIR/packages/core" && pnpm pack --pack-destination "$PACKED_DIR" )
( cd "$ROOT_DIR/packages/client" && pnpm pack --pack-destination "$PACKED_DIR" )
( cd "$ROOT_DIR/packages/cli" && pnpm pack --pack-destination "$PACKED_DIR" )

shopt -s nullglob
for t in "$PACKED_DIR"/*.tgz; do
  if tar -xOf "$t" package/package.json 2>/dev/null | grep -qE 'workspace:\*|link:|file:'; then
    echo "Packed package $t contains a monorepo-only dependency reference." >&2
    exit 1
  fi
done

cd "$TMP_DIR"
npm init -y >/dev/null
export KALEIDO_TEMPLATES_DIR="$ROOT_DIR/packages/templates"
npm install "$PACKED_DIR"/kaleido-core-*.tgz "$PACKED_DIR"/kaleido-client-*.tgz "$PACKED_DIR"/kaleido-cli-*.tgz

node --input-type=module -e 'import { defineConfig } from "@kaleido/core"; console.log(typeof defineConfig)'
node --input-type=module -e 'import { createKaleidoClient } from "@kaleido/client"; console.log(typeof createKaleidoClient)'
npx kaleido --version
npx kaleido init test-app --template react-vite-counter
test -f test-app/kaleido.config.ts
test -f test-app/kaleido.artifacts.json
