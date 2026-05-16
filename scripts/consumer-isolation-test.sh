#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKED_DIR="${PACKED_DIR:-$ROOT_DIR/packed}"
SKIP_PACK="${SKIP_PACK:-0}"
TMP_DIR="${TMPDIR:-/tmp}/kaleido-consumer-test"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

if [[ "$SKIP_PACK" != "1" ]]; then
  rm -rf "$PACKED_DIR"
  mkdir -p "$PACKED_DIR"
  pnpm --dir "$ROOT_DIR" build
  ( cd "$ROOT_DIR/packages/core" && pnpm pack --pack-destination "$PACKED_DIR" )
  ( cd "$ROOT_DIR/packages/client" && pnpm pack --pack-destination "$PACKED_DIR" )
  ( cd "$ROOT_DIR/packages/cli" && pnpm pack --pack-destination "$PACKED_DIR" )
else
  mkdir -p "$PACKED_DIR"
fi

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
npm install "$PACKED_DIR"/kaleido-xlm-core-*.tgz "$PACKED_DIR"/kaleido-xlm-client-*.tgz "$PACKED_DIR"/kaleido-xlm-cli-*.tgz

node --input-type=module -e 'import { defineConfig } from "@kaleido-xlm/core"; console.log(typeof defineConfig)'
node --input-type=module -e 'import { createKaleidoClient } from "@kaleido-xlm/client"; console.log(typeof createKaleidoClient)'
npx kaleido --version
npx kaleido init test-app --template react-vite-counter
test -f test-app/kaleido.config.ts
test -f test-app/kaleido.artifacts.json

cd test-app

_kcore=( "$PACKED_DIR"/kaleido-xlm-core-*.tgz )
_kclient=( "$PACKED_DIR"/kaleido-xlm-client-*.tgz )
_kcli=( "$PACKED_DIR"/kaleido-xlm-cli-*.tgz )
if [[ ${#_kcore[@]} -eq 0 || ${#_kclient[@]} -eq 0 || ${#_kcli[@]} -eq 0 ]]; then
  echo "Missing packed tarballs in $PACKED_DIR" >&2
  exit 1
fi

export KALEIDO_PATCH_CORE="file:$(realpath "${_kcore[0]}")"
export KALEIDO_PATCH_CLIENT="file:$(realpath "${_kclient[0]}")"
export KALEIDO_PATCH_CLI="file:$(realpath "${_kcli[0]}")"

node --input-type=module -e "
import { readFileSync, writeFileSync } from \"node:fs\";
const pj = JSON.parse(readFileSync(\"package.json\", \"utf8\"));
pj.dependencies[\"@kaleido-xlm/core\"] = process.env.KALEIDO_PATCH_CORE;
pj.dependencies[\"@kaleido-xlm/client\"] = process.env.KALEIDO_PATCH_CLIENT;
if (pj.devDependencies && Object.prototype.hasOwnProperty.call(pj.devDependencies, \"@kaleido-xlm/cli\")) {
  pj.devDependencies[\"@kaleido-xlm/cli\"] = process.env.KALEIDO_PATCH_CLI;
}
if (pj.dependencies && Object.prototype.hasOwnProperty.call(pj.dependencies, \"@kaleido-xlm/cli\")) {
  pj.dependencies[\"@kaleido-xlm/cli\"] = process.env.KALEIDO_PATCH_CLI;
}
writeFileSync(\"package.json\", JSON.stringify(pj, null, 2) + \"\\n\");
"

npm install
npm run build
cd "$TMP_DIR"
