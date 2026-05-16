import { defineConfig } from "@kaleido-xlm/core";

export default defineConfig({
  project: "__PROJECT_NAME__",
  defaultNetwork: "testnet",
  contracts: {
    token: {
      path: "./contracts/token",
      wasm: "./contracts/token/target/wasm32-unknown-unknown/release/token.wasm"
    },
    marketplace: {
      path: "./contracts/marketplace",
      wasm: "./contracts/marketplace/target/wasm32-unknown-unknown/release/marketplace.wasm",
      dependsOn: ["token"],
      deployArgs: {
        tokenContractId: "${contracts.token.contractId}"
      }
    }
  },
  networks: {
    testnet: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015"
    }
  },
  frontend: {
    framework: "vite-react",
    bindingsOutput: "./src/contracts/generated"
  }
});
