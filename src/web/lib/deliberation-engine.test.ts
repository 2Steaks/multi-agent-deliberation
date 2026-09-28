import { describe, expect, it, vi } from "vitest";
import { createDeliberationRun, createRunCounter, type WorkflowStreamChunk } from "./deliberation-engine";
import type { Synthesis, SpecialistId, SpecialistView } from "./types";

function stepStart(id: string): WorkflowStreamChunk {
  return { type: "workflow-step-start", payload: { id } };
}

function stepResult(id: string, status: "success" | "failed", output?: unknown): WorkflowStreamChunk {
  return { type: "workflow-step-result", payload: { id, status, output } };
}

function view(role: string): SpecialistView {
  return { role, stance: "support", keyPoints: [role], risks: [], questions: [], confidence: 0.5 };
}

const synthesis: Synthesis = {
  agreement: ["a"],
  disagreement: [],
  openQuestions: [],
  recommendation: "do it",
  killConditions: [],
};

async function* streamOf(chunks: WorkflowStreamChunk[]): AsyncIterable<WorkflowStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const ALL_IDS: SpecialistId[] = ["engineer", "product", "ux", "customer", "skeptic"];

function baseParams(streamRun: (problem: string) => AsyncIterable<WorkflowStreamChunk>) {
  return {
    problem: "Should we?",
    runNumber: 1,
    streamRun,
    retrySpecialistCall: vi.fn(),
    runSynthesisCall: vi.fn(),
  };
}

describe("createDeliberationRun", () => {
  it("starts every specialist waiting, with idle synthesis and a running status", () => {
    const run = createDeliberationRun(baseParams(() => streamOf([])));
    const snapshot = run.getSnapshot();

    expect(snapshot.status).toBe("running");
    expect(snapshot.synthesis).toEqual({ status: "idle", result: null, error: null });
    expect(snapshot.specialists).toHaveLength(5);
    for (const specialist of snapshot.specialists) {
      expect(specialist.status).toBe("waiting");
    }
  });

  it("completes specialists independently out of order, then gates and runs synthesis", async () => {
    let resolveGate: () => void = () => {};
    const gate = new Promise<void>((resolve) => (resolveGate = resolve));

    async function* stream() {
      yield stepStart("product");
      yield stepResult("product", "success", view("Product"));
      yield stepStart("engineer");
      yield stepStart("ux");
      yield stepResult("ux", "success", view("UX"));
      yield stepStart("customer");
      yield stepStart("skeptic");
      yield stepResult("skeptic", "success", view("Skeptic"));
      yield stepResult("engineer", "success", view("Engineer"));
      yield stepResult("customer", "success", view("Customer"));
      await gate;
      yield stepStart("synthesize");
      yield stepResult("synthesize", "success", synthesis);
    }

    const run = createDeliberationRun(baseParams(() => stream()));
    await flush();

    let snapshot = run.getSnapshot();
    expect(snapshot.specialists.every((s) => s.status === "complete")).toBe(true);
    expect(snapshot.synthesis.status).toBe("idle"); // not started until its own step-start arrives

    resolveGate();
    await flush();

    snapshot = run.getSnapshot();
    expect(snapshot.synthesis).toEqual({ status: "done", result: synthesis, error: null });
    expect(snapshot.status).toBe("done");
  });

  it("keeps a failed specialist scoped to its own card, and retrying it triggers direct synthesis once all five are complete", async () => {
    const chunks: WorkflowStreamChunk[] = [];
    for (const id of ALL_IDS) chunks.push(stepStart(id));
    for (const id of ALL_IDS) {
      chunks.push(id === "engineer" ? stepResult(id, "failed") : stepResult(id, "success", view(id)));
    }
    const retrySpecialistCall = vi.fn().mockResolvedValue(view("Engineer"));
    const runSynthesisCall = vi.fn().mockResolvedValue(synthesis);
    const run = createDeliberationRun({
      ...baseParams(() => streamOf(chunks)),
      retrySpecialistCall,
      runSynthesisCall,
    });

    await flush();
    let snapshot = run.getSnapshot();
    expect(snapshot.specialists.find((s) => s.id === "engineer")?.status).toBe("error");
    expect(snapshot.status).not.toBe("error"); // four succeeded, this isn't a whole-run failure
    expect(runSynthesisCall).not.toHaveBeenCalled();

    run.retrySpecialist("engineer");
    await flush();

    expect(retrySpecialistCall).toHaveBeenCalledWith("engineer", "Should we?");
    expect(runSynthesisCall).toHaveBeenCalledTimes(1);
    snapshot = run.getSnapshot();
    expect(snapshot.specialists.find((s) => s.id === "engineer")?.status).toBe("complete");
    expect(snapshot.synthesis.status).toBe("done");
    expect(snapshot.status).toBe("done");
  });

  it("sets a run-level error when the stream fails before any specialist succeeds", async () => {
    async function* stream(): AsyncGenerator<WorkflowStreamChunk> {
      yield stepStart("engineer");
      throw new Error("network down");
    }
    const run = createDeliberationRun(baseParams(() => stream()));

    await flush();

    const snapshot = run.getSnapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.error).toEqual(expect.any(String));
  });

  it("stops reacting to stream events and retries once disposed", async () => {
    let yieldSecond: () => void = () => {};
    const gate = new Promise<void>((resolve) => (yieldSecond = resolve));

    async function* stream(): AsyncGenerator<WorkflowStreamChunk> {
      yield stepStart("engineer");
      yield stepResult("engineer", "failed");
      await gate;
      yield stepStart("product");
    }

    const retrySpecialistCall = vi.fn().mockResolvedValue(view("Engineer"));
    const run = createDeliberationRun({ ...baseParams(() => stream()), retrySpecialistCall });

    await flush();
    run.retrySpecialist("engineer");
    const beforeDispose = run.getSnapshot();
    run.dispose();

    yieldSecond();
    await flush();
    await flush();

    expect(run.getSnapshot()).toEqual(beforeDispose);
  });
});

describe("createRunCounter", () => {
  it("increments starting from 1", () => {
    const counter = createRunCounter();
    expect(counter.next()).toBe(1);
    expect(counter.next()).toBe(2);
  });
});
