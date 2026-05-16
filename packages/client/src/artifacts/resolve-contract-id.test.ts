import { describe, expect, it } from "vitest";
import { KaleidoError, KaleidoErrorCode, type KaleidoArtifacts } from "@kaleido-xlm/core";
import { resolveContractId } from "./resolve-contract-id.js";

const artifacts: KaleidoArtifacts = {
  project: "counter-app",
  version: 1,
  networks: {
    testnet: {
      contracts: {
        counter: {
          contractId: "CCOUNTER000000000000000000000000000000000000000000000000",
          wasmHash: "hash",
          deployedAt: "2026-05-12T00:00:00.000Z",
          sourcePath: "contracts/counter",
          wasmPath: "target/wasm32-unknown-unknown/release/counter.wasm",
          dependencies: [],
          resolvedDeployArgs: {}
        }
      },
      dependencyGraph: {}
    }
  }
};

describe("resolveContractId", () => {
  it("uses explicit contract id before artifacts", () => {
    const contractId = resolveContractId({
      artifacts,
      network: "testnet",
      contract: "counter",
      explicitContractId: "CEXPLICIT00000000000000000000000000000000000000000000000"
    });

    expect(contractId).toBe("CEXPLICIT00000000000000000000000000000000000000000000000");
  });

  it("resolves contract id from network artifacts", () => {
    const contractId = resolveContractId({
      artifacts,
      network: "testnet",
      contract: "counter"
    });

    expect(contractId).toBe("CCOUNTER000000000000000000000000000000000000000000000000");
  });

  it("throws when no matching contract artifact exists", () => {
    expect(() =>
      resolveContractId({
        artifacts,
        network: "testnet",
        contract: "token"
      })
    ).toThrowError(KaleidoError);

    try {
      resolveContractId({ artifacts, network: "testnet", contract: "token" });
    } catch (error) {
      expect(error).toBeInstanceOf(KaleidoError);
      expect((error as KaleidoError).code).toBe(KaleidoErrorCode.CONTRACT_ARTIFACT_NOT_FOUND);
    }
  });
});
