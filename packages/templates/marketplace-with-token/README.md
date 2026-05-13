# __PROJECT_NAME__

Experimental Kaleido multi-contract template.

## Deploy

```bash
npm install
npx kaleido build token
npx kaleido build marketplace
npx kaleido deploy --network testnet --source alice
```

Deploy order:

1. `token`
2. `marketplace`

`marketplace.deployArgs.tokenContractId` resolves from `${contracts.token.contractId}` after the token deploy writes `kaleido.artifacts.json`.
