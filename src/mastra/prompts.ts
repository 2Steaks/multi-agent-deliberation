/**
 * Pure prompt templates, with zero dependency on `@mastra/core` or anything
 * else backend-only, so they can be imported directly by both the workflow
 * steps and the browser UI's direct-agent retry calls — a single source of
 * truth instead of two hand-copies that can drift.
 */

/**
 * Must match the order of `.parallel([...])` in `workflows/deliberation.ts`
 * — kept here as the one place both that file and the browser client's
 * direct-agent retry calls read it from, rather than each hand-maintaining
 * their own copy.
 */
export const SPECIALIST_IDS = ["engineer", "product", "ux", "customer", "skeptic"] as const;

export function buildSpecialistPrompt(id: string, problem: string): string {
  return `Problem:\n${problem}\n\nRespond as the ${id} specialist.`;
}

export function buildSynthesisPrompt(views: unknown[]): string {
  return `Here are five specialist views on the same problem, as JSON:\n${JSON.stringify(views, null, 2)}\n\nProduce the synthesis.`;
}
