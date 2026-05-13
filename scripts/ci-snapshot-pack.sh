#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKED_DIR="$ROOT_DIR/packed"
EXTRACT_DIR="$ROOT_DIR/packed-unpacked-package-jsons"

rm -rf "$PACKED_DIR" "$EXTRACT_DIR" "$ROOT_DIR/.changeset/__ci_snapshot__.md"
mkdir -p "$PACKED_DIR" "$EXTRACT_DIR"

if [[ ! -d "$ROOT_DIR/packages/core/dist" ]]; then
  pnpm --dir "$ROOT_DIR" build
fi

cat > "$ROOT_DIR/.changeset/__ci_snapshot__.md" <<'EOF'
---
"@kaleido/cli": patch
---

chore: ci snapshot for pack validation (do not commit)
EOF

pnpm --dir "$ROOT_DIR" exec changeset version --snapshot smoke

( cd "$ROOT_DIR/packages/core" && pnpm pack --pack-destination "$PACKED_DIR" )
( cd "$ROOT_DIR/packages/client" && pnpm pack --pack-destination "$PACKED_DIR" )
( cd "$ROOT_DIR/packages/cli" && pnpm pack --pack-destination "$PACKED_DIR" )

shopt -s nullglob
for t in "$PACKED_DIR"/*.tgz; do
  base="$(basename "$t" .tgz)"
  mkdir -p "$EXTRACT_DIR/$base"
  tar -xzf "$t" -C "$EXTRACT_DIR/$base" package/package.json
  if grep -qE 'workspace:\*|link:|file:' "$EXTRACT_DIR/$base/package/package.json"; then
    echo "Packed package $t contains monorepo-only dependency reference." >&2
    cat "$EXTRACT_DIR/$base/package/package.json" >&2
    exit 1
  fi
done

echo "ci-snapshot-pack: OK"
