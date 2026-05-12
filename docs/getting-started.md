# Getting Started

```bash
pnpm install
pnpm build
pnpm --filter @kaleido/cli dev init my-dapp
cd my-dapp
npm install
npx kaleido build counter
npx kaleido deploy counter --network testnet --source alice
npx kaleido generate counter --network testnet
npx kaleido invoke counter.increment --network testnet --source alice
```

Prerequisites:

- Rust
- `wasm32-unknown-unknown` Rust target
- Stellar CLI
- A local Stellar CLI identity for deploy and invoke
