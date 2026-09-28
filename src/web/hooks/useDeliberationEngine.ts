import { useCallback, useEffect, useRef, useState } from "react";
import { createDeliberationRun, createRunCounter, type DeliberationRun } from "../lib/deliberation-engine";
import { retrySpecialistAgent, runSynthesisAgent, streamDeliberationRun } from "../lib/mastra-client";
import type { DeliberationSnapshot, SpecialistId } from "../lib/types";

export function useDeliberationEngine() {
  const [counter] = useState(() => createRunCounter());
  const runRef = useRef<DeliberationRun | null>(null);
  const [snapshot, setSnapshot] = useState<DeliberationSnapshot | null>(null);

  const start = useCallback(
    (problem: string) => {
      runRef.current?.dispose();
      const run = createDeliberationRun({
        problem,
        runNumber: counter.next(),
        streamRun: streamDeliberationRun,
        retrySpecialistCall: retrySpecialistAgent,
        runSynthesisCall: runSynthesisAgent,
      });
      runRef.current = run;
      setSnapshot(run.getSnapshot());
      run.subscribe(() => setSnapshot(run.getSnapshot()));
    },
    [counter],
  );

  const reset = useCallback(() => {
    runRef.current?.dispose();
    runRef.current = null;
    setSnapshot(null);
  }, []);

  const retrySpecialist = useCallback((id: SpecialistId) => {
    runRef.current?.retrySpecialist(id);
  }, []);

  const retrySynthesis = useCallback(() => {
    runRef.current?.retrySynthesis();
  }, []);

  useEffect(() => () => runRef.current?.dispose(), []);

  return { snapshot, start, reset, retrySpecialist, retrySynthesis };
}
