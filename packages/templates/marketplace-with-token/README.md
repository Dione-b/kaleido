# __PROJECT_NAME__

Experimental Caatinga multi-contract template.

## Deploy

```bash
npm install
npx caatinga build token
npx caatinga build marketplace
npx caatinga deploy --network testnet --source alice
```

Deploy order:

1. `token`
2. `marketplace`

`marketplace.deployArgs.tokenContractId` resolves from `${contracts.token.contractId}` after the token deploy writes `caatinga.artifacts.json`.
