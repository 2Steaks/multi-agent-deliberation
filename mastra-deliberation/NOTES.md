# Friction log

Entries written as they happened during the build. Each entry: what I tried, what happened, what the docs say / whether a better approach exists, and a verdict — `my mistake` / `docs gap` / `real API friction`.

## Phase 1: docs verification + scaffold

- **What I tried**: looked up `agent.generate()` structured output via web search first; a GitHub issue surfaced `experimental_output` as a known-flaky option ("invalid JSON response" errors even with a Zod schema supplied).
- **What happened**: the current docs page (`docs/agents/structured-output`) uses a different, newer option name: `structuredOutput: { schema }`, with the result on `response.object`.
- **What the docs say**: `structuredOutput` is the current API; `experimental_output` appears to be an older/parallel path with known issues per a linked GitHub discussion.
- **Verdict**: docs gap (in my own search ordering, not Mastra's) — worth flagging in the observation anyway, since a model answering from memory or from a stale blog post would very plausibly reach for `experimental_output` and hit exactly the flakiness that issue describes.

## Phase 2: typing the parallel step's output into the synthesizer's input schema

- **What I tried**: a `specialistStep(id: string, agent)` helper that calls `createStep({ id, ... })` for each of the five specialists, to avoid repeating the same step boilerplate five times.
- **What happened**: TypeScript failed to unify `.parallel([...]).then(synthesizeStep)` — the synthesizer step's `inputSchema` names five literal keys (`engineer`, `product`, ...), but because the helper's `id` parameter was typed as plain `string`, TypeScript widened every step's id to `string`, so the inferred parallel output type was `{ [x: string]: SpecialistView }` instead of a keyed object with the five literal properties. The two didn't unify.
- **What the docs say**: the docs' own parallel example never factors step creation into a helper — each `createStep({ id: 'literal-id', ... })` is written out by hand, which sidesteps this entirely because each `id` is already a string-literal type at the call site.
- **Verdict**: real API friction (a docs/type-inference gap, not a runtime one) — the parallel-step API's "combined output keyed by id" design is only as type-safe as each id being inferred as a literal, which silently breaks the moment you extract a helper function, and the error message (a wall of structurally-expanded types) gives no hint that the fix is "make id generic." Fixed by making the helper generic over `Id extends string` so each call site's literal is preserved.
