# Kaleido

**Kaleido** is a developer toolkit and CLI for building dApps on **Stellar / Soroban**. It keeps a **predictable workflow**—create a project, build contracts, deploy, generate TypeScript bindings, and invoke—while **isolating Stellar CLI** details (flags, stdout, subprocess layout) inside [`@kaleido/core`](./packages/core).

Kaleido does **not** replace the Soroban SDK, Stellar SDK, or Stellar CLI. It **orchestrates** them and adds conventions: `kaleido.config.ts`, `kaleido.artifacts.json` per network, and templates tuned for JS/TS teams.

## Features

- **Stable CLI surface:** `init`, `build`, `deploy`, `generate`, `invoke` (plus `dev` as a placeholder until the opinionated dev server lands).
- **Artifacts per network:** deployed `contractId`, WASM hash, and paths—no manual copy-paste into the frontend for the happy path.
- **Template compatibility:** official templates ship a `kaleido.template.json` manifest and are checked against the current core version before copy.
- **Stellar CLI parser hardening:** fragile CLI output parsing is isolated in `@kaleido/core` and covered by versioned fixtures.
- **Public error codes:** failures expose documented `KALEIDO_*` codes that are safe for CI parsing.
- **Official template:** `react-vite-counter` (Vite + React + Soroban counter contract).
- **Security by default:** no private key storage, no telemetry in core; deploy/invoke use `--source` (Stellar CLI identity alias or public address only—secrets rejected).

## Monorepo

| Package | Role |
|---------|------|
| [`@kaleido/cli`](./packages/cli) | Argument parsing, terminal output, delegates to core. |
| [`@kaleido/core`](./packages/core) | Config and artifacts (Zod), networks/contracts resolution, Stellar CLI orchestration (`execa` only here). |
| [`packages/templates`](./packages/templates) | Templates copied by `kaleido init`. |

Requirements: **Node 20+**, **pnpm 9+**, **Rust 1.84+** + `wasm32v1-none`, **Stellar CLI**, and a local Stellar identity for deploy/invoke.

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

CI runs the same default checks:

```bash
pnpm typecheck
pnpm build
pnpm test
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
- **[Errors](./docs/errors.md)** — public `KALEIDO_*` codes.
- **[Testing](./docs/testing.md)** — fixture strategy and no-testnet default CI policy.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Turbo build for all packages. |
| `pnpm test` | Turbo test (`@kaleido/core`, `@kaleido/cli`). |
| `pnpm typecheck` | Typecheck across the workspace. |
| `pnpm dev` | Run `@kaleido/cli` in dev mode (`tsx`). |

## Contributing

Read [`docs/architecture.md`](./docs/architecture.md) and the ADRs under [`docs/adr/`](./docs/adr/) before large changes—especially anything that touches Stellar CLI parsing, public error codes, artifact shape, or template contracts.

## Repository

<https://github.com/Dione-b/kaleido>
