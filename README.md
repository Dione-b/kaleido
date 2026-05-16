<div align="center">

<h1>Caatinga</h1>

<p>Developer toolkit for building dApps on <strong>Stellar / Soroban</strong>.</p>

[![CI](https://img.shields.io/github/actions/workflow/status/Dione-b/caatinga/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Dione-b/caatinga/actions)
[![npm](https://img.shields.io/npm/v/@caatinga/cli?label=%40caatinga%2Fcli)](https://www.npmjs.com/package/@caatinga/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![pnpm 9+](https://img.shields.io/badge/pnpm-%3E%3D9-orange)](https://pnpm.io)

</div>

---

Caatinga gives JS/TS teams a **predictable workflow** for Soroban contracts: init, build, deploy, generate TypeScript bindings, invoke — without copy-pasting contract IDs or manually serializing SCVal.

It orchestrates **Stellar CLI**, **Stellar SDK**, and **Soroban SDK** rather than replacing them, and layers on a few strong conventions: a typed `caatinga.config.ts`, network-scoped `caatinga.artifacts.json`, and a thin `@caatinga/client` that wires generated bindings, artifact lookup, and wallet signing in one place.

> **Status:** Pre-v1 (`0.x` / `next`). The CLI surface is stable; see [v1 readiness](./docs/release/v1-readiness.md) for the remaining gates before `latest` is unfrozen.
> See [v1 release spec](./docs/release/v1.0.0.md) for the public contract required before `latest`.

## Table of Contents

- [Why Caatinga](#why-caatinga)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Browser Client](#browser-client)
- [Packages](#packages)
- [CLI Reference](#cli-reference)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Why Caatinga

| Without Caatinga | With Caatinga |
|---|---|
| Manually copy `contractId` into your frontend | `caatinga deploy` writes it to `caatinga.artifacts.json` automatically |
| Hand-serialize SCVal for every invocation | `@caatinga/client` handles it via generated bindings |
| Scatter Stellar CLI flags across scripts | Single config in `caatinga.config.ts` |
| Debug opaque CLI output by hand | Fragile parsing isolated in `@caatinga/core`, covered by versioned fixtures |
| XDR is a black box | `buildXdr()` / `debugXdr` expose unsigned, prepared, and signed XDR on demand |

**Non-goals:** Caatinga does not store private keys, ship telemetry, or replace Stellar's own tooling. `--source` accepts an identity alias or a public `G…` address — secret keys and seed phrases are refused.

## Requirements

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Rust** with the `wasm32-unknown-unknown` target for the supported Stellar CLI 22.x flow
- **[Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)**
- A local Stellar identity for CLI deploy/invoke operations

## Installation

```bash
npm install -g @caatinga/cli   # or pnpm / yarn
```

## Quick Start

```bash
# Scaffold a new project (Vite + React + Soroban counter contract)
caatinga init my-dapp
cd my-dapp

# Install dependencies
npm install

# Build → Deploy → Generate bindings → Invoke
npx caatinga build counter
npx caatinga deploy counter --network testnet --source <identity-or-G-address>
npx caatinga generate counter --network testnet
npx caatinga invoke counter.increment --network testnet --source <identity-or-G-address>
```

Use a Stellar CLI identity name (e.g. `alice`) or a public `G…` address for `--source`. Secret keys are rejected.

## Browser Client

`@caatinga/client` connects your generated bindings, artifacts, network config, and a wallet adapter with no manual plumbing:

```ts
import { createCaatingaClient } from "@caatinga/client";
import { freighterWalletAdapter } from "@caatinga/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../caatinga.artifacts.json";

const client = createCaatingaClient({
  network: {
    name: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  artifacts,
  wallet: freighterWalletAdapter,
  contracts: {
    counter: { binding: Counter },
  },
});

await client.contract("counter").invoke("increment");
```

## Packages

This is a **pnpm monorepo**. Each package has its own README.

| Package | Description |
|---|---|
| [`@caatinga/cli`](./packages/cli) | Argument parsing, terminal output — delegates to core. |
| [`@caatinga/core`](./packages/core) | Config and artifacts (Zod), network/contract resolution, Stellar CLI orchestration (`execa` only here). |
| [`@caatinga/client`](./packages/client) | Browser/client interop: generated bindings, artifact lookup, XDR visibility, wallet signing. |
| [`packages/templates`](./packages/templates) | Project templates copied by `caatinga init`. |

## CLI Reference

| Command | Description |
|---|---|
| `caatinga init <name>` | Scaffold a new project from a template. |
| `caatinga build <contract>` | Compile contract to WASM. |
| `caatinga deploy <contract>` | Deploy to a network; writes `contractId` to artifacts. |
| `caatinga generate <contract>` | Generate TypeScript bindings from deployed contract. |
| `caatinga invoke <contract.method>` | Invoke a contract method. |
| `caatinga dev` | Reserved — hidden in pre-v1 builds. Use your frontend dev server with `build` / `deploy` / `generate` / `invoke`. |

All commands accept `--network` (maps to a network defined in `caatinga.config.ts`) and `--source` (identity alias or public address).

## Documentation

| Doc | Description |
|---|---|
| [Architecture](./docs/architecture.md) | Promise, boundaries, roadmap, ADR index. |
| [Getting started](./docs/getting-started.md) | Prerequisites and first commands. |
| [Packages and scopes](./docs/packages.md) | Published `@caatinga/*` packages and monorepo `pnpm dev`. |
| [CLI](./docs/cli.md) | Full command reference. |
| [Client](./docs/client.md) | `@caatinga/client` API. |
| [Config](./docs/config.md) | `caatinga.config.ts` schema. |
| [Templates](./docs/templates.md) | Official templates and `caatinga.template.json`. |
| [Errors](./docs/errors.md) | Public `CAATINGA_*` error codes. |
| [Testing](./docs/testing.md) | Fixture strategy and no-testnet CI policy. |
| [Stellar CLI version contract](./docs/stellar-cli-version-contract.md) | Supported range and override policy. |
| [v1 readiness](./docs/release/v1-readiness.md) | Release gates before `v1.0.0`. |

## Contributing

Read [`docs/architecture.md`](./docs/architecture.md) and the [ADRs](./docs/adr/) before making changes that touch Stellar CLI parsing, public error codes, artifact shape, or template contracts.

### Development setup

```bash
git clone https://github.com/Dione-b/caatinga.git
cd caatinga
pnpm install
pnpm build
pnpm test
```

### Run the CLI from source

```bash
pnpm --filter @caatinga/cli dev -- --help
pnpm --filter @caatinga/cli dev init my-dapp
```

### Before opening a PR

```bash
pnpm typecheck   # tsc — unused locals/params are errors
pnpm build
pnpm test
pnpm knip        # no unused deps, exports, or files
```

> **Note:** Template packages under `packages/templates/*` are excluded from Knip analysis — they use placeholder `package.json` names until `caatinga init` materializes a project. If Knip flags an intentional public export, narrow the report with a documented `ignoreExports` comment rather than silencing broadly.

### Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
pnpm changeset   # describe your change before opening a PR
```

### Full CI gate (local)

```bash
pnpm ci:publish-matrix   # build → test → snapshot pack → publish dry-run → consumer smoke tests
```

## License

MIT © [caatinga contributors](https://github.com/Dione-b/caatinga/graphs/contributors)
