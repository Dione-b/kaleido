# Kaleido

**Kaleido** is an alpha developer toolkit for building dApps on **Stellar / Soroban**. It keeps a **predictable workflow**—create a project, build contracts, deploy, generate TypeScript bindings, invoke, and wire a browser client—while isolating Stellar CLI details inside [`@kaleido/core`](./packages/core).

Kaleido does **not** replace Stellar CLI, Stellar SDK, Soroban SDK, generated bindings, or wallet signing. It **orchestrates** them and adds conventions: `kaleido.config.ts`, network-scoped `kaleido.artifacts.json`, templates tuned for JS/TS teams, and a thin `@kaleido/client` layer for artifact lookup, wallet signing, and XDR visibility.

Current release target: **pre-v1** (`0.x` / `next`). Publication layout and CI gates are aligned with [v1 readiness](./docs/release/v1-readiness.md); `latest` remains intentionally strict.

## Features

- **Stable CLI surface:** `init`, `build`, `deploy`, `generate`, `invoke` (plus `dev` as a placeholder until the opinionated dev server lands).
- **Artifacts per network:** deployed `contractId`, WASM hash, and paths—no manual copy-paste into the frontend for the happy path.
- **Client interop:** `@kaleido/client` connects generated bindings, artifacts, network config, and wallet adapters without manually serializing SCVal or storing private keys.
- **XDR observability:** `buildXdr()` and explicit `debugXdr` expose unsigned/prepared/signed XDR only when requested.
- **Template compatibility:** official templates ship a `kaleido.template.json` manifest and are checked against the current core version before copy.
- **Stellar CLI parser hardening:** fragile CLI output parsing is isolated in `@kaleido/core` and covered by versioned fixtures.
- **Public error codes:** failures expose documented `KALEIDO_*` codes that are safe for CI parsing.
- **Official template:** `react-vite-counter` (Vite + React + Soroban counter contract).
- **Security by default:** no private key storage, no telemetry in core; deploy/invoke use `--source` (Stellar CLI identity alias or public address only—secrets rejected).

## Not in scope (yet)

- `kaleido doctor`
- CLI XDR commands
- `kaleido generate --interop`
- React hooks in `@kaleido/client`

Experimental multi-contract deploy, Stellar CLI version gating, consumer isolation packaging checks, and live testnet smoke CI exist in-repo; tagging `v1.0.0` still follows [v1 readiness](./docs/release/v1-readiness.md).

## Monorepo

| Package | Role |
|---------|------|
| [`@kaleido/cli`](./packages/cli) | Argument parsing, terminal output, delegates to core. |
| [`@kaleido/core`](./packages/core) | Config and artifacts (Zod), networks/contracts resolution, Stellar CLI orchestration (`execa` only here). |
| [`@kaleido/client`](./packages/client) | Thin browser/client interop layer for generated bindings, artifacts, XDR visibility, and wallet signing. |
| [`packages/templates`](./packages/templates) | Templates copied by `kaleido init`. |

Requirements: **Node 20+**, **pnpm 9+**, **Rust 1.84.0+** + `wasm32v1-none`, **Stellar CLI**, and a local Stellar identity for CLI deploy/invoke.

## Quick start (contributors)

From the repository root:

```bash
pnpm install
pnpm build
pnpm test
```

Run the CLI from source:

```bash
pnpm --filter @kaleido/cli dev -- --help
pnpm --filter @kaleido/cli dev init my-dapp
```

Before opening a PR, run the same checks CI uses for the libraries:

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm knip
```

`pnpm knip` reports unused dependencies, exports, and files (see [`knip.json`](./knip.json); template packages under `packages/templates/*` are excluded from analysis because they use placeholder `package.json` names until `kaleido init` materializes a project).

## Quick start (generated app)

After `kaleido init my-dapp`:

```bash
cd my-dapp
npm install   # or pnpm / yarn
npx kaleido build counter
npx kaleido deploy counter --network testnet --source <identity-or-G-address>
npx kaleido generate counter --network testnet
npx kaleido invoke counter.increment --network testnet --source <identity-or-G-address>
```

Use a Stellar CLI identity name (e.g. `alice`) or a **public** `G…` address for `--source`. Secret keys and seed phrases are refused.

For browser-side calls, use `@kaleido/client` with generated bindings, `kaleido.artifacts.json`, and a wallet adapter:

```ts
import { createKaleidoClient } from "@kaleido/client";
import { freighterWalletAdapter } from "@kaleido/client/freighter";
import * as Counter from "./contracts/generated/counter";
import artifacts from "../kaleido.artifacts.json";

const client = createKaleidoClient({
  network: {
    name: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015"
  },
  artifacts,
  wallet: freighterWalletAdapter,
  contracts: {
    counter: { binding: Counter }
  }
});

await client.contract("counter").invoke("increment");
```

## Documentation

- **[Architecture & product stance](./docs/architecture.md)** — promise, boundaries, roadmap, ADR index.
- **[Getting started](./docs/getting-started.md)** — prerequisites and commands.
- **[CLI](./docs/cli.md)** · **[Client](./docs/client.md)** · **[Config](./docs/config.md)** · **[Templates](./docs/templates.md)**
- **[Errors](./docs/errors.md)** — public `KALEIDO_*` codes.
- **[Testing](./docs/testing.md)** — fixture strategy and no-testnet default CI policy.
- **[Stellar CLI version contract](./docs/stellar-cli-version-contract.md)** — supported Stellar CLI range and override policy.
- **[v1 readiness](./docs/release/v1-readiness.md)** — release gates before `v1.0.0`.
- **[v0.1.0-alpha release notes](./docs/release/v0.1.0-alpha.md)** — internal alpha scope and verification gates.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Turbo build for all packages. |
| `pnpm test` | Turbo test (`@kaleido/core`, `@kaleido/client`, `@kaleido/cli`). |
| `pnpm typecheck` | Typecheck across the workspace (`tsc` with unused locals/parameters enforced in shared `tsconfig.base.json`). |
| `pnpm knip` | Find unused dependencies, exports, and files (Knip; templates ignored—see note above). |
| `pnpm dev` | Run `@kaleido/cli` in dev mode (`tsx`). |
| `pnpm test:consumer` | Pack tarballs, install outside the monorepo, and smoke-import CLI and client (`scripts/consumer-isolation-test.sh`). |
| `pnpm test:consumer:client-bundlers` | Same packed artifacts, then smoke-build with Vite and webpack consumer fixtures (`scripts/consumer-client-bundlers-test.sh`). |
| `pnpm pack:packages` | Produce `.tgz` for `core`, `client`, and `cli` under `./packed` (used by consumer scripts and dry-run publish checks). |
| `pnpm changeset` | [Changesets](https://github.com/changesets/changesets) CLI for version bumps and changelog entries. |
| `pnpm ci:snapshot-pack` | CI helper: snapshot pack workflow (`scripts/ci-snapshot-pack.sh`). |
| `pnpm publish:dry-run` | Dry-run publish all workspace packages (`pnpm publish -r --dry-run`). |
| `pnpm ci:publish-matrix` | Full local gate: build, test, snapshot pack, publish dry-run, then both consumer smoke scripts (mirrors heavy CI). |

## Contributing

Read [`docs/architecture.md`](./docs/architecture.md) and the ADRs under [`docs/adr/`](./docs/adr/) before large changes—especially anything that touches Stellar CLI parsing, public error codes, artifact shape, or template contracts.

Keep the tree clean of unused imports and dead exports: `pnpm typecheck` and `pnpm knip` should pass. If Knip flags an export that is part of the intentional public API from [`packages/core/src/index.ts`](./packages/core/src/index.ts) (or the other package entrypoints), narrow the report with a documented `ignoreExports` / Knip comment rather than silencing broadly.

## Repository

<https://github.com/Dione-b/kaleido>
