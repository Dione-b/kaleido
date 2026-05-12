import { describe, expect, it } from "vitest";
import { KaleidoConfigSchema } from "./config.schema.js";

const minimalValid = {
  project: "my-dapp",
  defaultNetwork: "testnet",
  contracts: {
    counter: {
      path: "./contracts/counter",
      wasm: "./target/wasm32v1-none/release/counter.wasm"
    }
  },
  networks: {
    testnet: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015"
    }
  },
  frontend: {
    framework: "vite-react" as const,
    bindingsOutput: "./src/contracts/generated"
  }
};

describe("KaleidoConfigSchema", () => {
  it("should_parse_valid_config_when_all_required_fields_present", () => {
    const parsed = KaleidoConfigSchema.parse(minimalValid);
    expect(parsed.project).toBe("my-dapp");
    expect(parsed.defaultNetwork).toBe("testnet");
    expect(parsed.contracts.counter.path).toContain("counter");
  });

  it("should_apply_default_network_when_omitted", () => {
    const { defaultNetwork, ...rest } = minimalValid;
    const parsed = KaleidoConfigSchema.parse(rest);
    expect(parsed.defaultNetwork).toBe("testnet");
  });

  it("should_apply_default_framework_when_omitted", () => {
    const { frontend, ...rest } = minimalValid;
    const parsed = KaleidoConfigSchema.parse({
      ...rest,
      frontend: { bindingsOutput: "./out" }
    });
    expect(parsed.frontend.framework).toBe("vite-react");
  });

  it("should_reject_when_contracts_record_empty", () => {
    expect(() =>
      KaleidoConfigSchema.parse({
        ...minimalValid,
        contracts: {}
      })
    ).toThrow();
  });

  it("should_reject_when_networks_record_empty", () => {
    expect(() =>
      KaleidoConfigSchema.parse({
        ...minimalValid,
        networks: {}
      })
    ).toThrow();
  });

  it("should_reject_invalid_rpc_url", () => {
    expect(() =>
      KaleidoConfigSchema.parse({
        ...minimalValid,
        networks: {
          testnet: {
            rpcUrl: "not-a-url",
            networkPassphrase: "x"
          }
        }
      })
    ).toThrow();
  });
});
