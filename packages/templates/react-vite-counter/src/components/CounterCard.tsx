import { useMemo, useState } from "react";

export function CounterCard() {
  const [count, setCount] = useState(0);
  const formattedCount = useMemo(() => new Intl.NumberFormat().format(count), [count]);

  return (
    <section className="counter-panel" aria-labelledby="counter-title">
      <div className="counter-panel__header">
        <div>
          <p className="eyebrow">Counter Contract</p>
          <h2 id="counter-title">Counter</h2>
        </div>
        <span className="network-pill">testnet</span>
      </div>

      <div className="counter-value">{formattedCount}</div>

      <div className="counter-actions">
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Increment
        </button>
        <button className="secondary-button" type="button" onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
    </section>
  );
}
