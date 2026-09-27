import { readFile } from "node:fs/promises";
import { mastra } from "./mastra";

const problem = await readFile(
  new URL("../problems/example.md", import.meta.url),
  "utf-8",
);

const workflow = mastra.getWorkflow("deliberation");
const run = await workflow.createRun();
const result = await run.start({ inputData: { problem } });

if (result.status === "success") {
  console.log(JSON.stringify(result.result, null, 2));
} else if (result.status === "failed") {
  console.error("Workflow failed:", result.error);
  process.exitCode = 1;
} else {
  console.error("Workflow ended with status:", result.status);
  process.exitCode = 1;
}
