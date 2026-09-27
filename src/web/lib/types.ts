/**
 * Mirrors the backend's `SpecialistView` / `Synthesis` shapes (see
 * `src/mastra/schemas.ts`) so this mock can later be swapped for a real
 * subscription to the `deliberation` workflow's run without reshaping the UI.
 */

export type Stance = "support" | "oppose" | "conditional";

export interface SpecialistView {
  role: string;
  stance: Stance;
  keyPoints: string[];
  risks: string[];
  questions: string[];
  confidence: number;
}

export interface Disagreement {
  topic: string;
  sides: string[];
}

export interface Synthesis {
  agreement: string[];
  disagreement: Disagreement[];
  openQuestions: string[];
  recommendation: string;
  killConditions: string[];
}

export type SpecialistId = "engineer" | "product" | "ux" | "customer" | "skeptic";

export type SpecialistStatus = "waiting" | "thinking" | "complete";

export interface SpecialistState {
  id: SpecialistId;
  role: string;
  description: string;
  status: SpecialistStatus;
  durationMs: number | null;
  result: SpecialistView | null;
}

export type SynthesisStatus = "idle" | "synthesizing" | "done";

export interface SynthesisState {
  status: SynthesisStatus;
  result: Synthesis | null;
}

export type RunStatus = "running" | "synthesizing" | "done";

export interface DeliberationSnapshot {
  runNumber: number;
  problem: string;
  status: RunStatus;
  specialists: SpecialistState[];
  synthesis: SynthesisState;
}
