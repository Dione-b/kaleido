export const templateId = "marketplace-with-token";

export function describeDeployFlow(): string {
  return [
    "1. caatinga build token",
    "2. caatinga build marketplace",
    "3. caatinga deploy --network testnet --source <identity>",
    "marketplace.deployArgs.tokenContractId resolves from caatinga.artifacts.json"
  ].join("\n");
}
