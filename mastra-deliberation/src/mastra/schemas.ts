import { z } from "zod";

export const specialistViewSchema = z.object({
  role: z.string(),
  stance: z.enum(["support", "oppose", "conditional"]),
  keyPoints: z.array(z.string()).max(3),
  risks: z.array(z.string()).max(3),
  questions: z.array(z.string()).max(2),
  confidence: z.number().min(0).max(1),
});

export type SpecialistView = z.infer<typeof specialistViewSchema>;

export const synthesisSchema = z.object({
  agreement: z.array(z.string()),
  disagreement: z.array(
    z.object({
      topic: z.string(),
      sides: z.array(z.string()),
    }),
  ),
  openQuestions: z.array(z.string()),
  recommendation: z.string(),
  killConditions: z.array(z.string()),
});

export type Synthesis = z.infer<typeof synthesisSchema>;
