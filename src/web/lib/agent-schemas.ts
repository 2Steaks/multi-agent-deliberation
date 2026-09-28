import { z } from "zod";
import { specialistViewSchema, synthesisSchema } from "../../mastra/schemas";

/**
 * `src/mastra/schemas.ts` has zero dependency on `@mastra/core` or anything
 * else backend-only (it only imports `zod`), so it's safe to import directly
 * into this client bundle rather than duplicating it — the client SDK's
 * `structuredOutput.schema` is serialized over HTTP and must be plain JSON
 * Schema, not a Zod object, hence the conversion here.
 */
export const specialistViewJsonSchema = z.toJSONSchema(specialistViewSchema, { target: "draft-7" });
export const synthesisJsonSchema = z.toJSONSchema(synthesisSchema, { target: "draft-7" });
