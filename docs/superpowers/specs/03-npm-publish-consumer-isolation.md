# Spec 03 — npm Publish Pipeline and Consumer Isolation

## Status

Required before v1.

## Problem

The monorepo may work locally while published packages fail for real consumers because of broken `exports`, missing `files`, unresolved `workspace:*`, ESM issues, missing `bin`, or browser bundling issues.

## Goal

Guarantee that packages work outside the monorepo before npm publish.

## Packages

Validate:

```txt
@caatinga/cli
@caatinga/core
@caatinga/client
```

Add later:

```txt
@caatinga/react
```

## Package requirements

Each package must define:

```json
{
  "name": "@caatinga/package",
  "version": "x.y.z",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md", "LICENSE"]
}
```

For `@caatinga/cli`:

```json
{
  "bin": {
    "caatinga": "./dist/index.js"
  }
}
```

## Publish tooling

Use Changesets.

Required files:

```txt
.changeset/config.json
.github/workflows/release.yml
scripts/consumer-isolation-test.sh
```

## Dry run

CI must run:

```bash
pnpm build
pnpm test
pnpm changeset version --snapshot smoke
pnpm pack --pack-destination ./packed
```

Do not rely only on `pnpm publish --dry-run`.

## Consumer isolation test

Create a temporary project outside the monorepo:

```bash
mkdir /tmp/caatinga-consumer-test
cd /tmp/caatinga-consumer-test
npm init -y
npm install /path/to/packed/caatinga-cli.tgz /path/to/packed/caatinga-client.tgz
npx caatinga --version
npx caatinga init test-app --template react-vite-counter
cd test-app
npm install
npm run build
```

If template build requires Rust/Stellar CLI, split tests:

```txt
consumer-packaging-test: no Rust/Stellar required
consumer-runtime-test: Rust/Stellar required
```

## Browser package test

`@caatinga/client` must pass:

```txt
Vite consumer test
webpack consumer test
bare ESM import test
```

Minimum test:

```ts
import { createCaatingaClient } from "@caatinga/client";
console.log(typeof createCaatingaClient);
```

## Workspace references

Published packages must not contain:

```txt
workspace:*
link:
file:
```

Add CI check:

```bash
grep -R "workspace:\*" packed-unpacked-package-jsons && exit 1
```

## Release workflow

```txt
checkout
setup pnpm
setup node
install
typecheck
build
test
pack packages
consumer isolation test
publish with provenance
```

Publishing command:

```bash
pnpm publish -r --access public --provenance
```

## Acceptance criteria

```txt
all packages have valid exports/types/files
@caatinga/cli works through npx from packed tarball
@caatinga/client imports in clean Vite project
no published package contains workspace:* dependency
release workflow publishes with provenance
pnpm publish dry run emits no warnings
```
