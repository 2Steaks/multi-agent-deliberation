import type { SpecialistId } from "./types";

/**
 * UI-only display copy for each specialist — role label and one-line
 * description. The backend exposes agent id/name and structured results,
 * not this tagline, so it lives here rather than coming over the wire.
 */

export interface SpecialistDefinition {
  id: SpecialistId;
  role: string;
  description: string;
}

export const SPECIALIST_DEFINITIONS: SpecialistDefinition[] = [
  { id: "engineer", role: "Engineer", description: "Technical feasibility" },
  { id: "product", role: "Product", description: "User value & product implications" },
  { id: "ux", role: "UX", description: "Usability & interaction" },
  { id: "customer", role: "Customer", description: "Customer needs & objections" },
  { id: "skeptic", role: "Skeptic", description: "Challenges assumptions & finds weaknesses" },
];
