import { Mastra } from "@mastra/core";
import { MastraStorageExporter, Observability } from "@mastra/observability";
import {
  customerAgent,
  engineerAgent,
  productAgent,
  skepticAgent,
  uxAgent,
} from "./agents/specialists";
import { synthesizerAgent } from "./agents/synthesizer";
import { deliberationWorkflow } from "./workflows/deliberation";

export const mastra = new Mastra({
  agents: {
    engineer: engineerAgent,
    product: productAgent,
    ux: uxAgent,
    customer: customerAgent,
    skeptic: skepticAgent,
    synthesizer: synthesizerAgent,
  },
  workflows: { deliberation: deliberationWorkflow },
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra-deliberation",
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
});
