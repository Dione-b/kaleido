import type { KaleidoArtifacts } from "@kaleido-xlm/core";

export interface KaleidoNetwork {
  name: string;
  rpcUrl: string;
  networkPassphrase: string;
}

export interface KaleidoWalletAdapter {
  getPublicKey(): Promise<string>;
  signTransaction(input: {
    xdr: string;
    networkPassphrase: string;
  }): Promise<string>;
}

export interface KaleidoContractRegistration {
  binding: unknown;
  contractId?: string;
}

export interface KaleidoClientConfig {
  network: KaleidoNetwork;
  artifacts: KaleidoArtifacts;
  wallet: KaleidoWalletAdapter;
  contracts: Record<string, KaleidoContractRegistration>;
}

export type KaleidoInvokeStatus =
  | "built"
  | "prepared"
  | "signed"
  | "submitted"
  | "confirmed"
  | "failed";

export interface KaleidoInvokeOptions {
  debugXdr?: boolean;
  debugRaw?: boolean;
}

export interface KaleidoInvokeResult<T = unknown> {
  status: KaleidoInvokeStatus;
  contract: string;
  method: string;
  contractId: string;
  transactionHash?: string;
  result?: T;
  xdr?: {
    unsigned?: string;
    prepared?: string;
    signed?: string;
  };
  raw?: unknown;
}

export interface KaleidoXdrBuildResult {
  contract: string;
  method: string;
  contractId: string;
  unsignedXdr?: string;
  preparedXdr: string;
  raw?: unknown;
}

export interface KaleidoBindingAdapter {
  createClient(input: {
    contractId: string;
    publicKey: string;
    rpcUrl: string;
    networkPassphrase: string;
  }): unknown;

  callMethod(input: {
    client: unknown;
    method: string;
    args?: Record<string, unknown>;
  }): Promise<unknown>;
}
