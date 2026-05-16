<div align="center">

<h1>Kaleido Stellar</h1>

<p>Developer toolkit for building dApps on <strong>Stellar / Soroban</strong>.</p>

[![CI](https://img.shields.io/github/actions/workflow/status/Dione-b/kaleido/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Dione-b/kaleido/actions)
[![npm](https://img.shields.io/npm/v/@kaleido-xlm/cli?label=%40kaleido%2Fcli)](https://www.npmjs.com/package/@kaleido-xlm/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![pnpm 9+](https://img.shields.io/badge/pnpm-%3E%3D9-orange)](https://pnpm.io)

</div>

---

Kaleido Stellar gives JS/TS teams a **predictable workflow** for Soroban contracts: init, build, deploy, generate TypeScript bindings, invoke — without copy-pasting contract IDs or manually serializing SCVal.

It orchestrates **Stellar CLI**, **Stellar SDK**, and **Soroban SDK** rather than replacing them, and layers on a few strong conventions: a typed `kaleido.config.ts`, network-scoped `kaleido.artifacts.json`, and a thin `@kaleido-xlm/client` that wires generated bindings, artifact lookup, and wallet signing in one place.

> **Status:** Pre-v1 (`0.x` / `next`). The CLI surface is stable; see [v1 readiness](./docs/release/v1-readiness.md) for the remaining gates before `latest` is unfrozen.
> See [v1 release spec](./docs/release/v1.0.0.md) for the public contract required before `latest`.

## Table of Contents

- [Why Kaleido Stellar](#why-kaleido-stellar)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Browser Client](#browser-client)
- [Packages](#packages)
- [CLI Reference](#cli-reference)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Why Kaleido Stellar

| Without Kaleido Stellar | With Kaleido Stellar |
|---|---|
| Manually copy `contractId` into your frontend | `kaleido deploy` writes it to `kaleido.artifacts.json` automatically |
| Hand-serialize SCVal for every invocation | `@kaleido-xlm/client` handles it via generated bindings |
| Scatter Stellar CLI flags across scripts | Single config in `kaleido.config.ts` |
| Debug opaque CLI output by hand | Fragile parsing isolated in `@kaleido-xlm/core`, covered by versioned fixtures |
| XDR is a black box | `buildXdr()` / `debugXdr` expose unsigned, prepared, and signed XDR on demand |

**Non-goals:** Kaleido Stellar does not store private keys, ship telemetry, or replace Stellar's own tooling. `--source` accepts an identity alias or a public `G…` address — secret keys and seed phrases are refused.

## Requirements

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Rust** with the `wasm32-unknown-unknown` target for the supported Stellar CLI 22.x flow
- **[Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)**
- A local Stellar identity for CLI deploy/invoke operations

## Installation

```bash
npm install -g @kaleido-xlm/cli   # or pnpm / yarn
```

## Quick Start

```bash
# Scaffold a new project (Vite + React + Soroban counter contract)
kaleido init my-dapp
cd my-dapp

# Install dependencies
npm install

# Build → Deploy → Generate bindings → Invoke
npx kaleido build counter
npx kaleido deploy counter --network testnet --source <identity-or-G-address>
npx kaleido generate counter --network testnet
npx kaleido invoke counter.increment --network testnet --source <identity-or-G-address>
```

Use a Stellar CLI identity name (e.g. `alice`) or a public `G…` address for `--source`. Secret keys are rejected.

## Browser Client

`@kaleido-xlm/client` connects your generated bindings, artifacts, network config, and a wallet adapter with no manual plumbing:

```ts
import { createKaleidoClient } from "@kaleido-xlm/client";
import { freighterWalletAdapter } from "@kaleido-xlm/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../kaleido.artifacts.json";

const client = createKaleidoClient({
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
| [`@kaleido-xlm/cli`](./packages/cli) | Argument parsing, terminal output — delegates to core. |
| [`@kaleido-xlm/core`](./packages/core) | Config and artifacts (Zod), network/contract resolution, Stellar CLI orchestration (`execa` only here). |
| [`@kaleido-xlm/client`](./packages/client) | Browser/client interop: generated bindings, artifact lookup, XDR visibility, wallet signing. |
| [`packages/templates`](./packages/templates) | Project templates copied by `kaleido init`. |

## CLI Reference

| Command | Description |
|---|---|
| `kaleido init <name>` | Scaffold a new project from a template. |
| `kaleido build <contract>` | Compile contract to WASM. |
| `kaleido deploy <contract>` | Deploy to a network; writes `contractId` to artifacts. |
| `kaleido generate <contract>` | Generate TypeScript bindings from deployed contract. |
| `kaleido invoke <contract.method>` | Invoke a contract method. |
| `kaleido dev` | Dev server placeholder (opinionated server coming soon). |

All commands accept `--network` (maps to a network defined in `kaleido.config.ts`) and `--source` (identity alias or public address).

## Documentation

| Doc | Description |
|---|---|
| [Architecture](./docs/architecture.md) | Promise, boundaries, roadmap, ADR index. |
| [Getting started](./docs/getting-started.md) | Prerequisites and first commands. |
| [CLI](./docs/cli.md) | Full command reference. |
| [Client](./docs/client.md) | `@kaleido-xlm/client` API. |
| [Config](./docs/config.md) | `kaleido.config.ts` schema. |
| [Templates](./docs/templates.md) | Official templates and `kaleido.template.json`. |
| [Errors](./docs/errors.md) | Public `KALEIDO_*` error codes. |
| [Testing](./docs/testing.md) | Fixture strategy and no-testnet CI policy. |
| [Stellar CLI version contract](./docs/stellar-cli-version-contract.md) | Supported range and override policy. |
| [v1 readiness](./docs/release/v1-readiness.md) | Release gates before `v1.0.0`. |

## Contributing

Read [`docs/architecture.md`](./docs/architecture.md) and the [ADRs](./docs/adr/) before making changes that touch Stellar CLI parsing, public error codes, artifact shape, or template contracts.

### Development setup

```bash
git clone https://github.com/Dione-b/kaleido.git
cd kaleido
pnpm install
pnpm build
pnpm test
```

### Run the CLI from source

```bash
pnpm --filter @kaleido-xlm/cli dev -- --help
pnpm --filter @kaleido-xlm/cli dev init my-dapp
```

### Before opening a PR

```bash
pnpm typecheck   # tsc — unused locals/params are errors
pnpm build
pnpm test
pnpm knip        # no unused deps, exports, or files
```

> **Note:** Template packages under `packages/templates/*` are excluded from Knip analysis — they use placeholder `package.json` names until `kaleido init` materializes a project. If Knip flags an intentional public export, narrow the report with a documented `ignoreExports` comment rather than silencing broadly.

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

MIT © [Kaleido contributors](https://github.com/Dione-b/kaleido/graphs/contributors)
