import { KaleidoError, KaleidoErrorCode } from "@kaleido/core";
import { resolveContractId } from "../artifacts/resolve-contract-id.js";
import { createDefaultBindingAdapter } from "../bindings/default-binding-adapter.js";
import { buildXdr as buildTransactionXdr } from "../xdr/build-xdr.js";
import type {
  KaleidoBindingAdapter,
  KaleidoClientConfig,
  KaleidoContractRegistration,
  KaleidoInvokeOptions,
  KaleidoInvokeResult,
  KaleidoXdrBuildResult
} from "../types.js";

interface SubmitTransactionLike {
  signAndSend?: (input?: { signedXdr: string }) => Promise<unknown> | unknown;
  send?: (input?: { signedXdr: string }) => Promise<unknown> | unknown;
}

export class KaleidoContractClient {
  constructor(
    private readonly config: KaleidoClientConfig,
    private readonly contractName: string,
    private readonly registration: KaleidoContractRegistration,
    private readonly bindingAdapter: KaleidoBindingAdapter = createDefaultBindingAdapter(
      registration.binding as never
    )
  ) {}

  async buildXdr(
    method: string,
    argsOrOptions?: Record<string, unknown>,
    maybeOptions?: { debugRaw?: boolean }
  ): Promise<KaleidoXdrBuildResult> {
    const { args, debugRaw } = splitArgsAndOptions(argsOrOptions, maybeOptions);
    const { contractId, transaction } = await this.createTransaction(method, args);

    return buildTransactionXdr({
      contractName: this.contractName,
      method,
      contractId,
      transaction,
      debug: debugRaw
    });
  }

  async invoke<T = unknown>(
    method: string,
    argsOrOptions?: Record<string, unknown> | KaleidoInvokeOptions,
    maybeOptions?: KaleidoInvokeOptions
  ): Promise<KaleidoInvokeResult<T>> {
    const { args, debugXdr, debugRaw } = splitInvokeArgsAndOptions(argsOrOptions, maybeOptions);
    const { contractId, transaction } = await this.createTransaction(method, args);
    const xdr = await buildTransactionXdr({
      contractName: this.contractName,
      method,
      contractId,
      transaction,
      debug: debugRaw
    });

    let signedXdr: string;
    try {
      signedXdr = await this.config.wallet.signTransaction({
        xdr: xdr.preparedXdr,
        networkPassphrase: this.config.network.networkPassphrase
      });
    } catch (error) {
      throw new KaleidoError(
        `Failed to sign XDR for "${this.contractName}.${method}".`,
        KaleidoErrorCode.XDR_SIGN_FAILED,
        "Connect a wallet and approve the transaction.",
        error
      );
    }

    const raw = await submitTransaction(transaction, signedXdr, this.contractName, method);
    const normalized = normalizeSubmitResult<T>(raw);

    return {
      status: "confirmed",
      contract: this.contractName,
      method,
      contractId,
      ...(normalized.transactionHash ? { transactionHash: normalized.transactionHash } : {}),
      ...(normalized.result !== undefined ? { result: normalized.result } : {}),
      ...(debugXdr
        ? {
            xdr: {
              unsigned: xdr.unsignedXdr,
              prepared: xdr.preparedXdr,
              signed: signedXdr
            }
          }
        : {}),
      ...(debugRaw ? { raw } : {})
    };
  }

  private async createTransaction(method: string, args?: Record<string, unknown>) {
    const contractId = resolveContractId({
      artifacts: this.config.artifacts,
      network: this.config.network.name,
      contract: this.contractName,
      explicitContractId: this.registration.contractId
    });
    const publicKey = await this.config.wallet.getPublicKey();
    const client = this.bindingAdapter.createClient({
      contractId,
      publicKey,
      rpcUrl: this.config.network.rpcUrl,
      networkPassphrase: this.config.network.networkPassphrase
    });
    const transaction = await this.bindingAdapter.callMethod({ client, method, args });

    return { contractId, transaction };
  }
}

function splitArgsAndOptions(
  argsOrOptions?: Record<string, unknown>,
  maybeOptions?: { debugRaw?: boolean }
) {
  return {
    args: argsOrOptions,
    debugRaw: maybeOptions?.debugRaw ?? false
  };
}

function splitInvokeArgsAndOptions(
  argsOrOptions?: Record<string, unknown> | KaleidoInvokeOptions,
  maybeOptions?: KaleidoInvokeOptions
) {
  const looksLikeOptions =
    argsOrOptions !== undefined &&
    ("debugXdr" in argsOrOptions || "debugRaw" in argsOrOptions) &&
    maybeOptions === undefined;

  if (looksLikeOptions) {
    const options = argsOrOptions as KaleidoInvokeOptions;
    return {
      args: undefined,
      debugXdr: options.debugXdr ?? false,
      debugRaw: options.debugRaw ?? false
    };
  }

  return {
    args: argsOrOptions as Record<string, unknown> | undefined,
    debugXdr: maybeOptions?.debugXdr ?? false,
    debugRaw: maybeOptions?.debugRaw ?? false
  };
}

async function submitTransaction(
  transaction: unknown,
  signedXdr: string,
  contractName: string,
  method: string
): Promise<unknown> {
  const candidate = transaction as SubmitTransactionLike;
  const submit = candidate.signAndSend ?? candidate.send;

  if (typeof submit !== "function") {
    throw new KaleidoError(
      `Binding transaction for "${contractName}.${method}" cannot be submitted.`,
      KaleidoErrorCode.XDR_SUBMIT_FAILED,
      "Regenerate bindings or provide a compatible binding adapter."
    );
  }

  try {
    return await submit.call(transaction, { signedXdr });
  } catch (error) {
    throw new KaleidoError(
      `Failed to submit XDR for "${contractName}.${method}".`,
      KaleidoErrorCode.XDR_SUBMIT_FAILED,
      "Check wallet signature and RPC connectivity.",
      error
    );
  }
}

function normalizeSubmitResult<T>(raw: unknown): {
  transactionHash?: string;
  result?: T;
} {
  const candidate = raw as {
    txHash?: string;
    transactionHash?: string;
    hash?: string;
    result?: T;
  };

  return {
    transactionHash: candidate.txHash ?? candidate.transactionHash ?? candidate.hash,
    result: candidate.result
  };
}
