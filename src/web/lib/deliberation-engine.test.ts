import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDeliberationRun,
  createRunCounter,
  SPECIALIST_MAX_MS,
  SYNTHESIS_MAX_MS,
} from "./deliberation-engine";
import { SPECIALIST_DEFINITIONS } from "./mock-data";
import type { SpecialistId } from "./types";

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createDeliberationRun", () => {
  it("starts every specialist waiting, with an idle synthesis and a running status", () => {
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom([0.5]) });
    const snapshot = run.getSnapshot();

    expect(snapshot.runNumber).toBe(1);
    expect(snapshot.problem).toBe("Should we?");
    expect(snapshot.status).toBe("running");
    expect(snapshot.synthesis).toEqual({ status: "idle", result: null });
    expect(snapshot.specialists).toHaveLength(5);
    for (const specialist of snapshot.specialists) {
      expect(specialist.status).toBe("waiting");
      expect(specialist.durationMs).toBeNull();
      expect(specialist.result).toBeNull();
    }
  });

  it("moves every specialist to thinking almost immediately", () => {
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom([0.5]) });

    vi.advanceTimersByTime(0);

    for (const specialist of run.getSnapshot().specialists) {
      expect(specialist.status).toBe("thinking");
    }
  });

  it("completes each specialist with a duration and a result matching the mock shape", () => {
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom([0.5]) });

    vi.advanceTimersByTime(SPECIALIST_MAX_MS);

    for (const specialist of run.getSnapshot().specialists) {
      expect(specialist.status).toBe("complete");
      expect(specialist.durationMs).toEqual(expect.any(Number));
      expect(specialist.durationMs).toBeGreaterThan(0);
      expect(specialist.result).toMatchObject({
        role: specialist.role,
        stance: expect.stringMatching(/^(support|oppose|conditional)$/),
        keyPoints: expect.any(Array),
        risks: expect.any(Array),
        questions: expect.any(Array),
        confidence: expect.any(Number),
      });
    }
  });

  it("completes specialists at different times and in an order that depends on randomness", () => {
    const order: SpecialistId[] = [];
    const runA = createDeliberationRun({
      problem: "Should we?",
      runNumber: 1,
      random: sequenceRandom([0.9, 0.1, 0.5, 0.7, 0.3]),
    });
    const unsubscribeA = runA.subscribe(() => {
      for (const specialist of runA.getSnapshot().specialists) {
        if (specialist.status === "complete" && !order.includes(specialist.id)) {
          order.push(specialist.id);
        }
      }
    });

    vi.advanceTimersByTime(SPECIALIST_MAX_MS);
    unsubscribeA();

    // random sequence maps 1:1 onto SPECIALIST_DEFINITIONS order (engineer,
    // product, ux, customer, skeptic); ascending random -> ascending duration
    // -> that order of completion.
    expect(order).toEqual(["product", "skeptic", "ux", "customer", "engineer"]);

    const orderB: SpecialistId[] = [];
    const runB = createDeliberationRun({
      problem: "Should we?",
      runNumber: 2,
      random: sequenceRandom([0.2, 0.8, 0.4, 0.05, 0.6]),
    });
    runB.subscribe(() => {
      for (const specialist of runB.getSnapshot().specialists) {
        if (specialist.status === "complete" && !orderB.includes(specialist.id)) {
          orderB.push(specialist.id);
        }
      }
    });

    vi.advanceTimersByTime(SPECIALIST_MAX_MS);

    expect(orderB).toEqual(["customer", "engineer", "ux", "skeptic", "product"]);
    expect(orderB).not.toEqual(order);
  });

  it("does not start synthesis until every specialist has completed", () => {
    // engineer finishes at SPECIALIST_MAX_MS (random=1), everyone else near-instant (random=0)
    const values = SPECIALIST_DEFINITIONS.map((def) => (def.id === "engineer" ? 1 : 0));
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom(values) });

    vi.advanceTimersByTime(SPECIALIST_MAX_MS - 1);
    let snapshot = run.getSnapshot();
    expect(snapshot.status).not.toBe("synthesizing");
    expect(snapshot.synthesis.status).toBe("idle");
    expect(snapshot.specialists.find((s) => s.id === "engineer")?.status).toBe("thinking");

    vi.advanceTimersByTime(1);
    snapshot = run.getSnapshot();
    expect(snapshot.status).toBe("synthesizing");
    expect(snapshot.synthesis.status).toBe("synthesizing");
  });

  it("completes synthesis after all specialists finish, with a result matching the mock shape", () => {
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom([0.1]) });

    vi.advanceTimersByTime(SPECIALIST_MAX_MS + SYNTHESIS_MAX_MS);

    const snapshot = run.getSnapshot();
    expect(snapshot.status).toBe("done");
    expect(snapshot.synthesis.status).toBe("done");
    expect(snapshot.synthesis.result).toMatchObject({
      agreement: expect.any(Array),
      disagreement: expect.any(Array),
      openQuestions: expect.any(Array),
      recommendation: expect.any(String),
      killConditions: expect.any(Array),
    });
  });

  it("notifies subscribers on every transition and stops after unsubscribing", () => {
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom([0.1]) });
    const listener = vi.fn();
    const unsubscribe = run.subscribe(listener);

    vi.advanceTimersByTime(0);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    vi.advanceTimersByTime(SPECIALIST_MAX_MS + SYNTHESIS_MAX_MS);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops all pending work once disposed", () => {
    const run = createDeliberationRun({ problem: "Should we?", runNumber: 1, random: sequenceRandom([0.1]) });
    vi.advanceTimersByTime(0);

    run.dispose();
    const beforeDispose = run.getSnapshot();

    vi.advanceTimersByTime(SPECIALIST_MAX_MS + SYNTHESIS_MAX_MS);
    expect(run.getSnapshot()).toEqual(beforeDispose);
  });
});

describe("createRunCounter", () => {
  it("increments starting from 1", () => {
    const counter = createRunCounter();
    expect(counter.next()).toBe(1);
    expect(counter.next()).toBe(2);
    expect(counter.next()).toBe(3);
  });

  it("keeps independent state across separate counters", () => {
    const a = createRunCounter();
    const b = createRunCounter();
    expect(a.next()).toBe(1);
    expect(a.next()).toBe(2);
    expect(b.next()).toBe(1);
  });
});
