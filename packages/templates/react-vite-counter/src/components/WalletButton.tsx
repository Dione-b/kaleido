import { useState } from "react";

export function WalletButton() {
  const [connected, setConnected] = useState(false);

  return (
    <button className="wallet-button" type="button" onClick={() => setConnected((value) => !value)}>
      <span className={connected ? "status-dot status-dot--on" : "status-dot"} />
      {connected ? "Connected" : "Connect"}
    </button>
  );
}
