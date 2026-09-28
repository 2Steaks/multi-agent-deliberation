import { SPECIALIST_DEFINITIONS } from "./specialists";
import type { DeliberationSnapshot, SpecialistId, SpecialistState, SpecialistView, Synthesis } from "./types";

const SYNTHESIZE_STEP_ID = "synthesize";
const SPECIALIST_IDS = new Set<string>(SPECIALIST_DEFINITIONS.map((def) => def.id));

function isSpecialistId(id: string): id is SpecialistId {
  return SPECIALIST_IDS.has(id);
}

/**
 * A loose structural stand-in for a Mastra workflow stream chunk — only the
 * fields this engine actually reads. Kept independent of `@mastra/client-js`
 * so this module has no network dependency and can be driven by fakes in
 * tests.
 */
export interface WorkflowStreamChunk {
  type: string;
  payload?: {
    id?: string;
    status?: string;
    output?: unknown;
    error?: { message?: string };
  };
}

export interface DeliberationRun {
  getSnapshot(): DeliberationSnapshot;
  subscribe(listener: () => void): () => void;
  dispose(): void;
  retrySpecialist(id: SpecialistId): void;
  retrySynthesis(): void;
}

export interface CreateDeliberationRunParams {
  problem: string;
  runNumber: number;
  /** Given the problem, streams the real workflow run's events. */
  streamRun: (problem: string) => AsyncIterable<WorkflowStreamChunk>;
  /** Calls one specialist's agent directly, bypassing the (concluded) workflow run. */
  retrySpecialistCall: (id: SpecialistId, problem: string) => Promise<SpecialistView>;
  /** Calls the synthesizer agent directly with the five specialists' results. */
  runSynthesisCall: (views: Record<SpecialistId, SpecialistView>) => Promise<Synthesis>;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function messageFromChunk(chunk: WorkflowStreamChunk, fallback: string): string {
  return chunk.payload?.error?.message || fallback;
}

export function createDeliberationRun(params: CreateDeliberationRunParams): DeliberationRun {
  const { problem, streamRun, retrySpecialistCall, runSynthesisCall } = params;
  const listeners = new Set<() => void>();
  const startedAt = new Map<SpecialistId, number>();
  let disposed = false;

  let snapshot: DeliberationSnapshot = {
    runNumber: params.runNumber,
    problem,
    status: "running",
    specialists: SPECIALIST_DEFINITIONS.map(
      (def): SpecialistState => ({
        id: def.id,
        role: def.role,
        description: def.description,
        status: "waiting",
        durationMs: null,
        result: null,
        error: null,
      }),
    ),
    synthesis: { status: "idle", result: null, error: null },
    error: null,
  };

  function setSnapshot(next: DeliberationSnapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function updateSpecialist(id: SpecialistId, patch: Partial<SpecialistState>) {
    setSnapshot({
      ...snapshot,
      specialists: snapshot.specialists.map((specialist) =>
        specialist.id === id ? { ...specialist, ...patch } : specialist,
      ),
    });
  }

  function completeSpecialist(id: SpecialistId, result: SpecialistView, durationMs: number) {
    updateSpecialist(id, { status: "complete", result, durationMs, error: null });
  }

  function buildViewsRecord(): Record<SpecialistId, SpecialistView> {
    const record = {} as Record<SpecialistId, SpecialistView>;
    for (const specialist of snapshot.specialists) {
      if (specialist.result) record[specialist.id] = specialist.result;
    }
    return record;
  }

  function maybeStartRecoverySynthesis() {
    if (snapshot.synthesis.status !== "idle") return;
    if (!snapshot.specialists.every((specialist) => specialist.status === "complete")) return;
    runSynthesis();
  }

  function runSynthesis() {
    setSnapshot({ ...snapshot, status: "synthesizing", synthesis: { status: "synthesizing", result: null, error: null } });
    runSynthesisCall(buildViewsRecord()).then(
      (result) => {
        if (disposed) return;
        setSnapshot({ ...snapshot, status: "done", synthesis: { status: "done", result, error: null } });
      },
      (error) => {
        if (disposed) return;
        setSnapshot({ ...snapshot, synthesis: { status: "error", result: null, error: messageFrom(error) } });
      },
    );
  }

  function handleChunk(chunk: WorkflowStreamChunk) {
    const id = chunk.payload?.id;
    if (!id) return;

    if (chunk.type === "workflow-step-start") {
      if (isSpecialistId(id)) {
        const specialist = snapshot.specialists.find((s) => s.id === id);
        if (specialist && specialist.status !== "thinking") {
          startedAt.set(id, Date.now());
          updateSpecialist(id, { status: "thinking", error: null });
        }
      } else if (id === SYNTHESIZE_STEP_ID && snapshot.synthesis.status !== "synthesizing") {
        setSnapshot({ ...snapshot, status: "synthesizing", synthesis: { status: "synthesizing", result: null, error: null } });
      }
      return;
    }

    if (chunk.type === "workflow-step-result") {
      const succeeded = chunk.payload?.status === "success";
      if (isSpecialistId(id)) {
        if (succeeded) {
          // Not checked here: while the stream is still live, "all five complete"
          // doesn't mean the workflow won't still call synthesize itself — only
          // finalizeAfterStreamEnd() (stream concluded) and a successful retry
          // (which only happens post-conclusion) know that for certain.
          const duration = Date.now() - (startedAt.get(id) ?? Date.now());
          completeSpecialist(id, chunk.payload?.output as SpecialistView, duration);
        } else {
          updateSpecialist(id, { status: "error", error: messageFromChunk(chunk, "This specialist failed to complete.") });
        }
      } else if (id === SYNTHESIZE_STEP_ID) {
        if (succeeded) {
          setSnapshot({
            ...snapshot,
            status: "done",
            synthesis: { status: "done", result: chunk.payload?.output as Synthesis, error: null },
          });
        } else {
          setSnapshot({
            ...snapshot,
            synthesis: { status: "error", result: null, error: messageFromChunk(chunk, "Synthesis failed to complete.") },
          });
        }
      }
    }
  }

  function finalizeAfterStreamEnd(streamError?: unknown) {
    const anySpecialistSucceeded = snapshot.specialists.some((s) => s.status === "complete");
    if (!anySpecialistSucceeded) {
      setSnapshot({
        ...snapshot,
        status: "error",
        error: streamError ? messageFrom(streamError) : "The deliberation could not be completed.",
      });
      return;
    }

    setSnapshot({
      ...snapshot,
      specialists: snapshot.specialists.map((specialist) =>
        specialist.status === "waiting" || specialist.status === "thinking"
          ? { ...specialist, status: "error" as const, error: "This specialist did not complete." }
          : specialist,
      ),
      synthesis:
        snapshot.synthesis.status === "synthesizing"
          ? { status: "error", result: null, error: "Synthesis did not complete." }
          : snapshot.synthesis,
    });
    maybeStartRecoverySynthesis();
  }

  async function consumeStream() {
    try {
      for await (const chunk of streamRun(problem)) {
        if (disposed) return;
        handleChunk(chunk);
      }
    } catch (error) {
      if (disposed) return;
      finalizeAfterStreamEnd(error);
      return;
    }
    if (disposed) return;
    finalizeAfterStreamEnd();
  }

  void consumeStream();

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      listeners.clear();
    },
    retrySpecialist(id) {
      const specialist = snapshot.specialists.find((s) => s.id === id);
      if (!specialist || specialist.status !== "error") return;
      startedAt.set(id, Date.now());
      updateSpecialist(id, { status: "thinking", error: null });
      retrySpecialistCall(id, problem).then(
        (result) => {
          if (disposed) return;
          completeSpecialist(id, result, Date.now() - (startedAt.get(id) ?? Date.now()));
          maybeStartRecoverySynthesis();
        },
        (error) => {
          if (disposed) return;
          updateSpecialist(id, { status: "error", error: messageFrom(error) });
        },
      );
    },
    retrySynthesis() {
      if (snapshot.synthesis.status !== "error") return;
      runSynthesis();
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
