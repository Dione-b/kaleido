# Getting Started

Kaleido alpha supports the CLI path first, then optional browser/client integration through `@kaleido/client`.

## Prerequisites

- Node.js 20+
- pnpm 9+ for repository development
- Rust 1.84.0+
- `wasm32v1-none` Rust target
- Stellar CLI
- A local Stellar CLI identity for CLI deploy/invoke, for example `alice`
- Optional: Freighter or another wallet adapter for browser-side `@kaleido/client` calls

```bash
rustc --version
rustup target add wasm32v1-none
stellar --version
```

## From the repository

```bash
pnpm install
pnpm build
pnpm --filter @kaleido/cli dev init my-dapp
```

## Generated app flow

```bash
cd my-dapp
npm install
npx kaleido build counter
npx kaleido deploy counter --network testnet --source alice
npx kaleido generate counter --network testnet
npx kaleido invoke counter.increment --network testnet --source alice
```

Use a Stellar CLI identity alias or a public `G...` account for `--source`. Kaleido rejects likely secret keys and seed phrases.

## Browser client flow

After `generate`, register the generated bindings with `@kaleido/client`:

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

const result = await client.contract("counter").invoke("increment", {
  debugXdr: true
});
```

Use `buildXdr()` when you need unsigned/prepared XDR without wallet signing.

Default local checks:

```bash
pnpm typecheck
pnpm build
pnpm test
```

See [`client.md`](./client.md) for the client contract and debug behavior.
