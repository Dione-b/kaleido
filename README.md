# Kaleido

**Kaleido** is a developer toolkit and CLI for building dApps on **Stellar / Soroban**. It keeps a **predictable workflow**—create a project, build contracts, deploy, generate TypeScript bindings, and invoke—while **isolating Stellar CLI** details (flags, stdout, subprocess layout) inside [`@kaleido/core`](./packages/core).

Kaleido does **not** replace the Soroban SDK, Stellar SDK, or Stellar CLI. It **orchestrates** them and adds conventions: `kaleido.config.ts`, `kaleido.artifacts.json` per network, and templates tuned for JS/TS teams.

## Features

- **Stable CLI surface:** `init`, `build`, `deploy`, `generate`, `invoke` (plus `dev` as a placeholder until the opinionated dev server lands).
- **Artifacts per network:** deployed `contractId`, WASM hash, and paths—no manual copy-paste into the frontend for the happy path.
- **Official template:** `react-vite-counter` (Vite + React + Soroban counter contract).
- **Security by default:** no private key storage, no telemetry in core; deploy/invoke use `--source` (Stellar CLI identity alias or public address only—secrets rejected).

## Monorepo

| Package | Role |
|---------|------|
| [`@kaleido/cli`](./packages/cli) | Argument parsing, terminal output, delegates to core. |
| [`@kaleido/core`](./packages/core) | Config and artifacts (Zod), networks/contracts resolution, Stellar CLI orchestration (`execa` only here). |
| [`packages/templates`](./packages/templates) | Templates copied by `kaleido init`. |

Requirements: **Node 20+**, **pnpm 9+**, **Rust** + `wasm32-unknown-unknown`, **Stellar CLI**, and a local Stellar identity for deploy/invoke.

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

## Documentation

- **[Architecture & product stance](./docs/architecture.md)** — promise, boundaries, roadmap, ADR index.
- **[Getting started](./docs/getting-started.md)** — prerequisites and commands.
- **[CLI](./docs/cli.md)** · **[Config](./docs/config.md)** · **[Templates](./docs/templates.md)**

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Turbo build for all packages. |
| `pnpm test` | Turbo test (`@kaleido/core`, `@kaleido/cli`). |
| `pnpm typecheck` | Typecheck across the workspace. |
| `pnpm dev` | Run `@kaleido/cli` in dev mode (`tsx`). |

## Contributing

Read [`docs/architecture.md`](./docs/architecture.md) and the ADRs under [`docs/adr/`](./docs/adr/) before large changes—especially anything that touches Stellar CLI parsing, artifact shape, or template contracts.

## Repository

<https://github.com/Dione-b/kaleido>
