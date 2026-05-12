import { KaleidoError } from "../errors/KaleidoError.js";
import type { KaleidoConfig, NetworkConfig } from "../config/config.schema.js";

export type ResolvedNetwork = {
  name: string;
  config: NetworkConfig;
};

export function resolveNetwork(config: KaleidoConfig, networkName?: string): ResolvedNetwork {
  const name = networkName ?? config.defaultNetwork;
  const network = config.networks[name];

  if (!network) {
    throw new KaleidoError(
      `Network "${name}" is not configured.`,
      "NETWORK_NOT_FOUND",
      `Add "${name}" to kaleido.config.ts networks, or pass a configured --network value.`
    );
  }

  return { name, config: network };
}
