import type { ContractArtifact, KaleidoArtifacts } from "./artifact.schema.js";

export function updateArtifact(
  artifacts: KaleidoArtifacts,
  networkName: string,
  contractName: string,
  contractArtifact: ContractArtifact
): KaleidoArtifacts {
  return {
    ...artifacts,
    networks: {
      ...artifacts.networks,
      [networkName]: {
        contracts: {
          ...(artifacts.networks[networkName]?.contracts ?? {}),
          [contractName]: contractArtifact
        }
      }
    }
  };
}
