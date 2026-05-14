import type { ContractConfig } from "../config/config.schema.js";
import { KaleidoError, KaleidoErrorCode } from "../errors/KaleidoError.js";

type VisitState = "visiting" | "visited";

export function resolveDeployOrder(input: {
  contracts: Record<string, ContractConfig>;
  selectedContract?: string;
  includeDependencies: boolean;
}): string[] {
  const order: string[] = [];
  const state = new Map<string, VisitState>();
  const selected = input.selectedContract ? [input.selectedContract] : Object.keys(input.contracts);

  for (const contractName of selected) {
    visit(contractName, []);
  }

  return order;

  function visit(contractName: string, stack: string[]): void {
    const contract = input.contracts[contractName];

    if (!contract) {
      throw new KaleidoError(
        `Contract dependency "${contractName}" was not found.`,
        KaleidoErrorCode.CONTRACT_DEPENDENCY_NOT_FOUND,
        "Add the dependency to kaleido.config.ts or remove it from dependsOn."
      );
    }

    if (state.get(contractName) === "visited") {
      return;
    }

    if (state.get(contractName) === "visiting") {
      throw new KaleidoError(
        `Contract dependency cycle detected: ${[...stack, contractName].join(" -> ")}.`,
        KaleidoErrorCode.CONTRACT_DEPENDENCY_CYCLE,
        "Remove the cycle from dependsOn."
      );
    }

    state.set(contractName, "visiting");

    if (input.includeDependencies) {
      for (const dependency of contract.dependsOn) {
        visit(dependency, [...stack, contractName]);
      }
    } else if (contract.dependsOn.length > 0 && input.selectedContract === contractName) {
      for (const dependency of contract.dependsOn) {
        if (!input.contracts[dependency]) {
          throw new KaleidoError(
            `Contract dependency "${dependency}" was not found.`,
            KaleidoErrorCode.CONTRACT_DEPENDENCY_NOT_FOUND,
            "Add the dependency to kaleido.config.ts or remove it from dependsOn."
          );
        }
      }
    }

    state.set(contractName, "visited");
    if (!order.includes(contractName)) {
      order.push(contractName);
    }
  }
}
