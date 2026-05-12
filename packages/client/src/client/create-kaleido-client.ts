import { KaleidoError, KaleidoErrorCode } from "@kaleido/core";
import { KaleidoContractClient } from "./kaleido-contract-client.js";
import type { KaleidoClientConfig } from "../types.js";

export function createKaleidoClient(config: KaleidoClientConfig) {
  return {
    contract(contractName: string) {
      const registration = config.contracts[contractName];

      if (!registration) {
        throw new KaleidoError(
          `Contract "${contractName}" is not registered.`,
          KaleidoErrorCode.CONTRACT_NOT_FOUND,
          "Add the contract binding to createKaleidoClient()."
        );
      }

      return new KaleidoContractClient(config, contractName, registration);
    }
  };
}
