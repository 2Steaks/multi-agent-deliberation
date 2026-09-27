import { fileURLToPath } from "node:url";
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
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

// `mastra dev` and `npm run deliberate` run as separate processes; an
// absolute path ensures both point at the same SQLite file so traces
// written by the CLI run are visible in the dev server's Studio.
const dbPath = fileURLToPath(new URL("../../mastra.db", import.meta.url));

export const mastra = new Mastra({
  storage: new LibSQLStore({ id: "mastra-deliberation", url: `file:${dbPath}` }),
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
