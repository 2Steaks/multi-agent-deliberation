import { MOCK_SPECIALIST_VIEWS, MOCK_SYNTHESIS, SPECIALIST_DEFINITIONS } from "./mock-data";
import type { DeliberationSnapshot, SpecialistId, SpecialistState } from "./types";

/**
 * Durations are randomized within these ranges each run so completion order
 * varies; synthesis only starts once every specialist has completed.
 */
export const SPECIALIST_MIN_MS = 1200;
export const SPECIALIST_MAX_MS = 2800;
export const SYNTHESIS_MIN_MS = 1400;
export const SYNTHESIS_MAX_MS = 2600;

export interface DeliberationRun {
  getSnapshot(): DeliberationSnapshot;
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

export interface CreateDeliberationRunParams {
  problem: string;
  runNumber: number;
  /** Injectable source of randomness in [0, 1); defaults to `Math.random`. */
  random?: () => number;
}

function randomInRange(min: number, max: number, random: () => number): number {
  return min + random() * (max - min);
}

export function createDeliberationRun(params: CreateDeliberationRunParams): DeliberationRun {
  const random = params.random ?? Math.random;
  const listeners = new Set<() => void>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let disposed = false;

  let snapshot: DeliberationSnapshot = {
    runNumber: params.runNumber,
    problem: params.problem,
    status: "running",
    specialists: SPECIALIST_DEFINITIONS.map(
      (def): SpecialistState => ({
        id: def.id,
        role: def.role,
        description: def.description,
        status: "waiting",
        durationMs: null,
        result: null,
      }),
    ),
    synthesis: { status: "idle", result: null },
  };

  function setSnapshot(next: DeliberationSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function schedule(fn: () => void, ms: number) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!disposed) fn();
    }, ms);
    timers.add(timer);
  }

  function updateSpecialist(id: SpecialistId, patch: Partial<SpecialistState>) {
    setSnapshot({
      ...snapshot,
      specialists: snapshot.specialists.map((specialist) =>
        specialist.id === id ? { ...specialist, ...patch } : specialist,
      ),
    });
  }

  function completeSpecialist(id: SpecialistId, durationMs: number) {
    updateSpecialist(id, { status: "complete", durationMs, result: MOCK_SPECIALIST_VIEWS[id] });
    if (snapshot.specialists.every((specialist) => specialist.status === "complete")) {
      startSynthesis();
    }
  }

  function startSynthesis() {
    setSnapshot({ ...snapshot, status: "synthesizing", synthesis: { status: "synthesizing", result: null } });
    const duration = Math.round(randomInRange(SYNTHESIS_MIN_MS, SYNTHESIS_MAX_MS, random));
    schedule(() => {
      setSnapshot({ ...snapshot, status: "done", synthesis: { status: "done", result: MOCK_SYNTHESIS } });
    }, duration);
  }

  // The initial snapshot renders as `waiting`; this is a brief frame, not a
  // modeled queue delay.
  schedule(() => {
    setSnapshot({
      ...snapshot,
      specialists: snapshot.specialists.map((specialist) => ({ ...specialist, status: "thinking" })),
    });
    for (const def of SPECIALIST_DEFINITIONS) {
      const duration = Math.round(randomInRange(SPECIALIST_MIN_MS, SPECIALIST_MAX_MS, random));
      schedule(() => completeSpecialist(def.id, duration), duration);
    }
  }, 0);

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      listeners.clear();
    },
  };
}

export interface RunCounter {
  next(): number;
}

export function createRunCounter(): RunCounter {
  let current = 0;
  return {
    next: () => {
      current += 1;
      return current;
    },
  };
}
