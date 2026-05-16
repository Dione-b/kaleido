import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";
import type { CaatingaConfig, NetworkConfig } from "../config/config.schema.js";

export type ResolvedNetwork = {
  name: string;
  config: NetworkConfig;
};

export function resolveNetwork(config: CaatingaConfig, networkName?: string): ResolvedNetwork {
  const name = networkName ?? config.defaultNetwork;
  const network = config.networks[name];

  if (!network) {
    throw new CaatingaError(
      `Network "${name}" is not configured.`,
      CaatingaErrorCode.NETWORK_NOT_FOUND,
      `Add "${name}" to caatinga.config.ts networks, or pass a configured --network value.`
    );
  }

  return { name, config: network };
}
