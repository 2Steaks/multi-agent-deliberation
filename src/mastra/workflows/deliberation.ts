import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import {
  customerAgent,
  engineerAgent,
  productAgent,
  skepticAgent,
  uxAgent,
} from "../agents/specialists";
import { synthesizerAgent } from "../agents/synthesizer";
import { buildSpecialistPrompt, buildSynthesisPrompt, SPECIALIST_IDS } from "../prompts";
import { specialistViewSchema, synthesisSchema } from "../schemas";

const problemInputSchema = z.object({ problem: z.string() });

function specialistStep<Id extends string>(
  id: Id,
  agent: { generate: (typeof engineerAgent)["generate"] },
) {
  return createStep({
    id,
    inputSchema: problemInputSchema,
    outputSchema: specialistViewSchema,
    retries: 2,
    execute: async ({ inputData, tracingContext }) => {
      const response = await agent.generate(buildSpecialistPrompt(id, inputData.problem), {
        structuredOutput: { schema: specialistViewSchema },
        tracingContext,
      });
      return response.object;
    },
  });
}

const engineerStep = specialistStep("engineer", engineerAgent);
const productStep = specialistStep("product", productAgent);
const uxStep = specialistStep("ux", uxAgent);
const customerStep = specialistStep("customer", customerAgent);
const skepticStep = specialistStep("skeptic", skepticAgent);

const synthesizeStep = createStep({
  id: "synthesize",
  inputSchema: z.object({
    engineer: specialistViewSchema,
    product: specialistViewSchema,
    ux: specialistViewSchema,
    customer: specialistViewSchema,
    skeptic: specialistViewSchema,
  }),
  outputSchema: synthesisSchema,
  retries: 2,
  execute: async ({ inputData, tracingContext }) => {
    const views = SPECIALIST_IDS.map((id) => inputData[id]);
    const response = await synthesizerAgent.generate(buildSynthesisPrompt(views), {
      structuredOutput: { schema: synthesisSchema },
      tracingContext,
    });
    return response.object;
  },
});

export const deliberationWorkflow = createWorkflow({
  id: "deliberation",
  inputSchema: problemInputSchema,
  outputSchema: synthesisSchema,
})
  // Order must match SPECIALIST_IDS in ../prompts.
  .parallel([engineerStep, productStep, uxStep, customerStep, skepticStep])
  .then(synthesizeStep)
  .commit();
