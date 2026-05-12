import { getAddress, signTransaction } from "@stellar/freighter-api";
import type { KaleidoWalletAdapter } from "../types.js";

export const freighterWalletAdapter: KaleidoWalletAdapter = {
  async getPublicKey() {
    const response = await getAddress();
    return response.address;
  },

  async signTransaction({ xdr, networkPassphrase }) {
    const response = await signTransaction(xdr, { networkPassphrase });
    return response.signedTxXdr;
  }
};
