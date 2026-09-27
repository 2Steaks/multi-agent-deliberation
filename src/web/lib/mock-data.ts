import type { Synthesis, SpecialistId, SpecialistView } from "./types";

/**
 * Fixed, hand-authored mock dataset. It does not vary based on what the user
 * types into the problem textarea — there's no LLM call in this pass, so the
 * content is tonally consistent with the real specialist agents' instructions
 * (see `src/mastra/agents/`) rather than generated per-input.
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

export const MOCK_SPECIALIST_VIEWS: Record<SpecialistId, SpecialistView> = {
  engineer: {
    role: "Engineer",
    stance: "conditional",
    keyPoints: [
      "Real-time sync itself is well-trodden (CRDT/OT libraries exist), but presence and conflict resolution on top of our current document model needs a new sync layer, not a bolt-on.",
      "Our persistence layer assumes single-writer semantics; multi-writer support touches storage, not just the client.",
      "A phased rollout — presence and cursors first, live co-editing second — de-risks the biggest unknown before committing to full CRDT integration.",
    ],
    risks: [
      "Underestimating the persistence-layer rework could turn a 'few weeks' estimate into a quarter.",
      "Conflict-resolution edge cases (offline edits, merge conflicts) are where most real-time collab efforts blow their timeline.",
    ],
    questions: ["Can v1 be scoped to presence and cursors only, deferring live co-editing?"],
    confidence: 0.7,
  },
  product: {
    role: "Product",
    stance: "support",
    keyPoints: [
      "Real-time collaboration is the top competitive gap named in the last two quarters of lost-deal feedback.",
      "Success metric should be 'documents edited by 2+ people in the same session', not raw feature usage — that's what proves the value.",
      "Scope creep risk: comments, chat, and version history should be cut from v1; ship presence and live editing only.",
    ],
    risks: ["A shallow v1 (cursors only, no live editing) won't move the competitive narrative driving this."],
    questions: [
      "What's the minimum concurrent-editing experience that would actually close deals, versus just checking a feature box?",
    ],
    confidence: 0.75,
  },
  ux: {
    role: "UX",
    stance: "conditional",
    keyPoints: [
      "The moment that matters: what happens the instant a second person joins. No visible presence indicator in the first couple seconds and users assume they're alone.",
      "Cursor and selection indicators need to be legible without being distracting in dense documents — most competitors get this wrong.",
      "The conflict/merge moment, when two edits collide, is the single highest-friction point in the whole feature.",
    ],
    risks: ["Users abandon mid-edit the first time they see an unexplained content change from another person."],
    questions: ["Is there budget for dedicated conflict-resolution UI, or is the sync layer expected to make conflicts invisible?"],
    confidence: 0.65,
  },
  customer: {
    role: "Customer",
    stance: "support",
    keyPoints: [
      "Honestly, yes — I'd use this. Right now my team pastes screenshots of the doc back and forth, which is worse than not having a tool at all.",
      "It doesn't need to be fancy. I need to see my teammate is in the doc and not have our edits silently overwrite each other.",
      "If it's flaky — if I lose an edit even once — I'll go back to our old process and tell my team not to trust it.",
    ],
    risks: ["One bad first impression, a lost edit, and my whole team stops using it."],
    questions: ["What happens if my connection drops mid-edit — do I lose what I wrote?"],
    confidence: 0.8,
  },
  skeptic: {
    role: "Skeptic",
    stance: "oppose",
    keyPoints: [
      "The riskiest assumption: that 'lost deals cited missing collaboration' means customers will actually change behavior once we ship it. Feature-gap complaints are often post-hoc justification for a decision already made elsewhere.",
      "This is a multi-quarter infrastructure bet dressed up as a feature request — the persistence-layer rework the Engineer flagged is the real project, and it's being scoped like a UI feature.",
      "Competitors who've shipped this well spent 12-18 months on conflict resolution alone; timeline pressure is the biggest threat to shipping something trustworthy.",
    ],
    risks: ["We ship a shallow version to hit a deadline, it loses an edit once, and it damages trust beyond just this feature."],
    questions: ["Has anyone confirmed collaboration was the actual blocker on the specific lost deals cited, rather than a convenient reason?"],
    confidence: 0.6,
  },
};

export const MOCK_SYNTHESIS: Synthesis = {
  agreement: [
    "The current 'screenshot and take turns' workflow is a real, acknowledged pain point for customers.",
    "A phased rollout — presence and cursors before live co-editing — reduces risk versus shipping the full feature at once.",
    "The failure mode everyone converges on is the same: a lost or silently overwritten edit, which would damage trust well beyond this one feature.",
  ],
  disagreement: [
    {
      topic: "Whether the business case (lost deals) justifies a multi-quarter infrastructure investment",
      sides: [
        "Product and Customer: the competitive gap and workflow pain are real and worth committing to now.",
        "Skeptic: the 'lost deals' rationale is unverified and may be post-hoc justification — this is an infrastructure bet being scoped like a feature.",
      ],
    },
  ],
  openQuestions: [
    "Have the specific lost deals cited as justification been confirmed to have collaboration as the actual blocker?",
    "What's the minimum concurrent-editing experience that would move the competitive narrative, versus just shipping presence indicators?",
    "What's the fallback experience when a user's connection drops mid-edit?",
  ],
  recommendation:
    "Commit to a phased build: ship presence and cursor indicators first as a scoped, low-risk release, and gate full live co-editing — and the persistence-layer rework it requires — on validating the lost-deal rationale and proving the conflict-resolution UX.",
  killConditions: [
    "Follow-up with the cited lost deals shows collaboration wasn't the actual blocker.",
    "A conflict-resolution prototype loses or silently overwrites a real edit during internal dogfooding.",
  ],
};
