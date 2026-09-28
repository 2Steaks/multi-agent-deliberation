import { MastraClient } from "@mastra/client-js";
import { buildSpecialistPrompt, buildSynthesisPrompt, SPECIALIST_IDS } from "../../mastra/prompts";
import { specialistViewJsonSchema, synthesisJsonSchema } from "./agent-schemas";
import type { WorkflowStreamChunk } from "./deliberation-engine";
import type { SpecialistId, SpecialistView, Synthesis } from "./types";

const DELIBERATION_WORKFLOW_ID = "deliberation";

const mastraClient = new MastraClient({
  baseUrl: import.meta.env.VITE_MASTRA_API_URL ?? "http://localhost:4111",
});

/** Streams a real run of the `deliberation` workflow's events. */
export async function* streamDeliberationRun(problem: string): AsyncGenerator<WorkflowStreamChunk> {
  const workflow = mastraClient.getWorkflow(DELIBERATION_WORKFLOW_ID);
  const run = await workflow.createRun();
  const stream = await run.stream({ inputData: { problem } });
  for await (const chunk of stream) {
    yield chunk;
  }
}

/** Calls one specialist's agent directly, bypassing the (concluded) workflow run — the same prompt the workflow step itself builds. */
export async function retrySpecialistAgent(id: SpecialistId, problem: string): Promise<SpecialistView> {
  const agent = mastraClient.getAgent(id);
  const response = await agent.generate<SpecialistView>(buildSpecialistPrompt(id, problem), {
    structuredOutput: { schema: specialistViewJsonSchema },
  });
  return response.object as SpecialistView;
}

/** Calls the synthesizer agent directly with the five specialists' results — the same prompt the workflow's synthesize step builds. */
export async function runSynthesisAgent(views: Record<SpecialistId, SpecialistView>): Promise<Synthesis> {
  const orderedViews = SPECIALIST_IDS.map((id) => views[id]);
  const agent = mastraClient.getAgent("synthesizer");
  const response = await agent.generate<Synthesis>(buildSynthesisPrompt(orderedViews), {
    structuredOutput: { schema: synthesisJsonSchema },
  });
  return response.object as Synthesis;
}
