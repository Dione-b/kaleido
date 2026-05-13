import type { ContractArtifact, KaleidoArtifacts } from "./artifact.schema.js";

export function updateArtifact(
  artifacts: KaleidoArtifacts,
  networkName: string,
  contractName: string,
  contractArtifact: ContractArtifact,
  networkExtras?: { dependencyGraph?: Record<string, string[]> }
): KaleidoArtifacts {
  const existingNetwork = artifacts.networks[networkName] ?? { contracts: {}, dependencyGraph: {} };

  return {
    ...artifacts,
    networks: {
      ...artifacts.networks,
      [networkName]: {
        ...existingNetwork,
        dependencyGraph: networkExtras?.dependencyGraph ?? existingNetwork.dependencyGraph ?? {},
        contracts: {
          ...existingNetwork.contracts,
          [contractName]: contractArtifact
        }
      }
    }
  };
}
