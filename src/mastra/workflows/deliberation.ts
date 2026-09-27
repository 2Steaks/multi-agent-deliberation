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
    execute: async ({ inputData, tracingContext }) => {
      const response = await agent.generate(
        `Problem:\n${inputData.problem}\n\nRespond as the ${id} specialist.`,
        { structuredOutput: { schema: specialistViewSchema }, tracingContext },
      );
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
  execute: async ({ inputData, tracingContext }) => {
    const views = Object.values(inputData);
    const response = await synthesizerAgent.generate(
      `Here are five specialist views on the same problem, as JSON:\n${JSON.stringify(views, null, 2)}\n\nProduce the synthesis.`,
      { structuredOutput: { schema: synthesisSchema }, tracingContext },
    );
    return response.object;
  },
});

export const deliberationWorkflow = createWorkflow({
  id: "deliberation",
  inputSchema: problemInputSchema,
  outputSchema: synthesisSchema,
})
  .parallel([engineerStep, productStep, uxStep, customerStep, skepticStep])
  .then(synthesizeStep)
  .commit();
