#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKED_DIR="${PACKED_DIR:-$ROOT_DIR/packed}"
SKIP_PACK="${SKIP_PACK:-0}"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/kaleido-consumer-test.XXXXXX")"
NPM_CACHE_DIR="$TMP_DIR/.npm-cache"
NPM_USERCONFIG="$TMP_DIR/.npmrc"
RESOLVE_ABS_PATH_CMD='import path from "node:path"; process.stdout.write(path.resolve(process.argv[1]));'

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

unset KALEIDO_TEMPLATES_DIR

mkdir -p "$NPM_CACHE_DIR"
cat > "$NPM_USERCONFIG" <<EOF
cache=$NPM_CACHE_DIR
prefer-offline=true
audit=false
fund=false
progress=false
update-notifier=false
EOF

export NPM_CONFIG_CACHE="$NPM_CACHE_DIR"
export npm_config_cache="$NPM_CACHE_DIR"
export NPM_CONFIG_USERCONFIG="$NPM_USERCONFIG"
export npm_config_userconfig="$NPM_USERCONFIG"

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
  if ! tar -xOf "$t" package/package.json 2>/dev/null | node --input-type=module -e '
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(0, "utf8"));
const sections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies"
];

for (const section of sections) {
  for (const [name, value] of Object.entries(pkg[section] ?? {})) {
    if (/^(workspace:|link:|file:)/.test(value)) {
      console.error(`${section}.${name}=${value}`);
      process.exit(1);
    }
  }
}
'; then
    echo "Packed package $t contains a monorepo-only dependency reference." >&2
    exit 1
  fi
done

_kcore=( "$PACKED_DIR"/kaleido-xlm-core-*.tgz )
_kclient=( "$PACKED_DIR"/kaleido-xlm-client-*.tgz )
_kcli=( "$PACKED_DIR"/kaleido-xlm-cli-*.tgz )

if [[ ${#_kcore[@]} -ne 1 ]]; then
  echo "Expected exactly one core tarball in $PACKED_DIR, found ${#_kcore[@]}" >&2
  exit 1
fi

if [[ ${#_kclient[@]} -ne 1 ]]; then
  echo "Expected exactly one client tarball in $PACKED_DIR, found ${#_kclient[@]}" >&2
  exit 1
fi

if [[ ${#_kcli[@]} -ne 1 ]]; then
  echo "Expected exactly one CLI tarball in $PACKED_DIR, found ${#_kcli[@]}" >&2
  exit 1
fi

if ! tar -tzf "${_kcli[0]}" | grep -q '^package/templates/react-vite-counter/kaleido.template.json$'; then
  echo "CLI tarball is missing bundled templates: ${_kcli[0]}" >&2
  exit 1
fi

export EXPECTED_CORE_RANGE="^$(tar -xOf "${_kcore[0]}" package/package.json | node --input-type=module -e 'import { readFileSync } from "node:fs"; const pkg = JSON.parse(readFileSync(0, "utf8")); process.stdout.write(pkg.version);')"
export EXPECTED_CLIENT_RANGE="^$(tar -xOf "${_kclient[0]}" package/package.json | node --input-type=module -e 'import { readFileSync } from "node:fs"; const pkg = JSON.parse(readFileSync(0, "utf8")); process.stdout.write(pkg.version);')"
export EXPECTED_CLI_RANGE="^$(tar -xOf "${_kcli[0]}" package/package.json | node --input-type=module -e 'import { readFileSync } from "node:fs"; const pkg = JSON.parse(readFileSync(0, "utf8")); process.stdout.write(pkg.version);')"

cd "$TMP_DIR"
npm init -y >/dev/null
npm install --no-audit --fund=false --prefer-offline "${_kcore[0]}" "${_kclient[0]}" "${_kcli[0]}"

KALEIDO_BIN="$TMP_DIR/node_modules/.bin/kaleido"
if [[ ! -x "$KALEIDO_BIN" ]]; then
  echo "Expected local CLI binary at $KALEIDO_BIN" >&2
  exit 1
fi

node --input-type=module -e '
import { defineConfig } from "@kaleido-xlm/core";

if (typeof defineConfig !== "function") {
  console.error(`Expected defineConfig to be a function, found ${typeof defineConfig}`);
  process.exit(1);
}
'
node --input-type=module -e '
import { createKaleidoClient } from "@kaleido-xlm/client";

if (typeof createKaleidoClient !== "function") {
  console.error(
    `Expected createKaleidoClient to be a function, found ${typeof createKaleidoClient}`
  );
  process.exit(1);
}
'
"$KALEIDO_BIN" --version
"$KALEIDO_BIN" init test-app --template react-vite-counter
test -f test-app/kaleido.config.ts
test -f test-app/kaleido.artifacts.json

node --input-type=module -e '
import { readFileSync } from "node:fs";

const pj = JSON.parse(readFileSync("test-app/package.json", "utf8"));
const expected = {
  dependencies: {
    "@kaleido-xlm/core": process.env.EXPECTED_CORE_RANGE,
    "@kaleido-xlm/client": process.env.EXPECTED_CLIENT_RANGE
  },
  devDependencies: {
    "@kaleido-xlm/cli": process.env.EXPECTED_CLI_RANGE
  }
};

for (const [section, values] of Object.entries(expected)) {
  for (const [name, version] of Object.entries(values)) {
    if (pj[section]?.[name] !== version) {
      console.error(
        `Generated app manifest mismatch for ${section}.${name}: expected ${version}, found ${pj[section]?.[name] ?? "missing"}`
      );
      process.exit(1);
    }
  }
}
'

cd test-app

export KALEIDO_PATCH_CORE="file:$(node --input-type=module -e "$RESOLVE_ABS_PATH_CMD" "${_kcore[0]}")"
export KALEIDO_PATCH_CLIENT="file:$(node --input-type=module -e "$RESOLVE_ABS_PATH_CMD" "${_kclient[0]}")"
export KALEIDO_PATCH_CLI="file:$(node --input-type=module -e "$RESOLVE_ABS_PATH_CMD" "${_kcli[0]}")"

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

npm install --no-audit --fund=false --prefer-offline
npm run build
cd "$TMP_DIR"
