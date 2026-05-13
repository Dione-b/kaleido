import { KaleidoError, KaleidoErrorCode } from "@kaleido/core";
import type { KaleidoXdrBuildResult } from "../types.js";

interface XdrTransactionLike {
  toXDR?: () => string;
  prepare?: () => Promise<unknown> | unknown;
}

export async function buildXdr(input: {
  contractName: string;
  method: string;
  contractId: string;
  transaction: unknown;
  debug?: boolean;
}): Promise<KaleidoXdrBuildResult> {
  try {
    const transaction = input.transaction as XdrTransactionLike;
    const unsignedXdr = readXdr(transaction);

    let preparedTransaction: unknown;
    if (typeof transaction.prepare === "function") {
      try {
        preparedTransaction = await transaction.prepare();
      } catch (error) {
        if (error instanceof KaleidoError) {
          throw error;
        }

        throw new KaleidoError(
          `Failed to prepare XDR for "${input.contractName}.${input.method}".`,
          KaleidoErrorCode.XDR_PREPARE_FAILED,
          "Check RPC connectivity, simulation errors, and binding compatibility.",
          error
        );
      }
    } else {
      preparedTransaction = transaction;
    }

    const preparedXdr = readXdr(preparedTransaction);

    return {
      contract: input.contractName,
      method: input.method,
      contractId: input.contractId,
      unsignedXdr,
      preparedXdr,
      ...(input.debug ? { raw: preparedTransaction } : {})
    };
  } catch (error) {
    if (error instanceof KaleidoError) {
      throw error;
    }

    throw new KaleidoError(
      `Failed to build XDR for "${input.contractName}.${input.method}".`,
      KaleidoErrorCode.XDR_BUILD_FAILED,
      "Check the generated binding transaction object.",
      error
    );
  }
}

function readXdr(transaction: unknown): string {
  const candidate = transaction as XdrTransactionLike;

  if (typeof candidate.toXDR !== "function") {
    throw new KaleidoError(
      "Binding transaction object does not expose toXDR().",
      KaleidoErrorCode.XDR_BUILD_FAILED,
      "Regenerate bindings or provide a compatible binding adapter."
    );
  }

  return candidate.toXDR();
}
