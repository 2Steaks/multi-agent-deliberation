import { AppHeader } from "./components/AppHeader";
import { DeliberationView } from "./components/DeliberationView";
import { ProblemInput } from "./components/ProblemInput";
import { useDeliberationEngine } from "./hooks/useDeliberationEngine";

export function App() {
  const { snapshot, start, reset } = useDeliberationEngine();

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader />
      <main>{snapshot ? <DeliberationView snapshot={snapshot} onReset={reset} /> : <ProblemInput onSubmit={start} />}</main>
    </div>
  );
}
