import { useCallback, useEffect, useRef, useState } from "react";
import { createDeliberationRun, createRunCounter, type DeliberationRun } from "../lib/deliberation-engine";
import type { DeliberationSnapshot } from "../lib/types";

export function useDeliberationEngine() {
  const [counter] = useState(() => createRunCounter());
  const runRef = useRef<DeliberationRun | null>(null);
  const [snapshot, setSnapshot] = useState<DeliberationSnapshot | null>(null);

  const start = useCallback((problem: string) => {
    runRef.current?.dispose();
    const run = createDeliberationRun({ problem, runNumber: counter.next() });
    runRef.current = run;
    setSnapshot(run.getSnapshot());
    run.subscribe(() => setSnapshot(run.getSnapshot()));
  }, [counter]);

  const reset = useCallback(() => {
    runRef.current?.dispose();
    runRef.current = null;
    setSnapshot(null);
  }, []);

  useEffect(() => () => runRef.current?.dispose(), []);

  return { snapshot, start, reset };
}
