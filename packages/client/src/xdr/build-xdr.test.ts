import { describe, expect, it } from "vitest";
import { KaleidoError, KaleidoErrorCode } from "@kaleido-xlm/core";
import { buildXdr } from "./build-xdr.js";

describe("buildXdr", () => {
  it("should_map_prepare_rejection_to_XDR_PREPARE_FAILED_when_prepare_is_async", async () => {
    await expect(
      buildXdr({
        contractName: "counter",
        method: "increment",
        contractId: "CID",
        transaction: {
          toXDR() {
            return "AAAA_UNSIGNED";
          },
          prepare() {
            return Promise.reject(new Error("simulation failed"));
          }
        }
      })
    ).rejects.toMatchObject({
      code: KaleidoErrorCode.XDR_PREPARE_FAILED
    });
  });

  it("should_rethrow_KaleidoError_from_prepare_without_wrapping", async () => {
    const original = new KaleidoError("prep", KaleidoErrorCode.XDR_SIGN_FAILED);

    await expect(
      buildXdr({
        contractName: "counter",
        method: "increment",
        contractId: "CID",
        transaction: {
          toXDR() {
            return "AAAA_UNSIGNED";
          },
          prepare() {
            return Promise.reject(original);
          }
        }
      })
    ).rejects.toBe(original);
  });
});
