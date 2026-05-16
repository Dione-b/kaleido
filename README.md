<div align="center">

<h1>Caatinga</h1>

<p>CLI toolkit for Stellar / Soroban dApps — init, build, deploy, generate bindings, invoke.</p>

[![CI](https://img.shields.io/github/actions/workflow/status/Dione-b/caatinga/ci.yml?branch=main&label=CI&logo=github)](https://github.com/Dione-b/caatinga/actions)
[![npm](https://img.shields.io/npm/v/@caatinga/cli?label=%40caatinga%2Fcli)](https://www.npmjs.com/package/@caatinga/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

## Install

```bash
npm install -g @caatinga/cli
```

**You also need:**

- Node.js 20+
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) 22.x on your `PATH`
- Rust + `wasm32-unknown-unknown` (to compile contracts)
- A funded Stellar CLI identity (e.g. `alice`)

```bash
stellar keys generate alice --fund --network testnet
```

## Quick start

```bash
caatinga init my-dapp
cd my-dapp
npm install

npx caatinga build counter
npx caatinga deploy counter --network testnet --source alice
npx caatinga generate counter --network testnet
npx caatinga invoke counter.increment --network testnet --source alice
```

`deploy` writes the contract ID to `caatinga.artifacts.json`. `generate` creates TypeScript bindings under `contracts/generated/`.

## Commands

| Command | What it does |
|---|---|
| `caatinga init <dir>` | Create a project from a template |
| `caatinga build [contract]` | Compile contract WASM (default: `counter`) |
| `caatinga deploy [contract] --source <identity> --network <name>` | Deploy and save `contractId` to artifacts |
| `caatinga generate <contract> --network <name>` | Generate TS bindings from a deployed contract |
| `caatinga invoke <contract.method> --source <identity> --network <name>` | Call a contract method |

**Common flags**

- `--source` — Stellar CLI identity that can sign (e.g. `alice`). Public `G…` addresses are not accepted.
- `--network` — Network from `caatinga.config.ts` (e.g. `testnet`)
- `--force` — Redeploy even if artifacts already have a contract ID

## Browser apps

Use `@caatinga/client` with generated bindings, `caatinga.artifacts.json`, and a wallet adapter (Freighter):

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
  contracts: { counter: { binding: Counter } },
});

await client.contract("counter").invoke("increment");
```

## Project layout

After `init`, you typically work with:

- `caatinga.config.ts` — contracts, WASM paths, networks
- `caatinga.artifacts.json` — deployed contract IDs per network
- `contracts/` — Rust Soroban contracts
- `contracts/generated/` — bindings (after `generate`)

## Docs

- [Getting started](./docs/getting-started.md)
- [CLI reference](./docs/cli.md)
- [Config](./docs/config.md)
- [Client](./docs/client.md)
- [Errors](./docs/errors.md)

## Develop this repo

```bash
git clone https://github.com/Dione-b/caatinga.git && cd caatinga
pnpm install && pnpm build && pnpm test
pnpm --filter @caatinga/cli dev init my-dapp   # run CLI from source
```

## License

MIT
