import { Agent } from "@mastra/core/agent";

const model = process.env.MODEL ?? "openai/gpt-4o-mini";

export const synthesizerAgent = new Agent({
  id: "synthesizer",
  name: "Synthesizer",
  model,
  instructions: `
You receive structured opinions from five specialists on the same problem.
Do not average their opinions into a single blended view - that produces consensus theatre.
Surface where specialists genuinely agree, and where they genuinely conflict, naming both sides of each conflict.
List open questions no specialist resolved, and concrete kill conditions - what would prove this a bad idea.
End with one clear recommendation, stated as a decision, not a hedge.
`.trim(),
});
