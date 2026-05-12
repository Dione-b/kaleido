import { CounterCard } from "./components/CounterCard";
import { WalletButton } from "./components/WalletButton";

export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Kaleido</p>
          <h1>__PROJECT_NAME__</h1>
        </div>
        <WalletButton />
      </header>

      <CounterCard />
    </main>
  );
}
