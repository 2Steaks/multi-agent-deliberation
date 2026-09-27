import type { Synthesis } from "../lib/types";

interface SynthesisPanelProps {
  synthesis: Synthesis;
}

export function SynthesisPanel({ synthesis }: SynthesisPanelProps) {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-xl border border-zinc-900/10 bg-zinc-900 p-8 text-zinc-50 shadow-lg">
      <h2 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Synthesis</h2>
      <p className="mt-3 text-lg leading-relaxed font-medium text-zinc-50">{synthesis.recommendation}</p>

      <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <ListSection title="Agreement" items={synthesis.agreement} />
        <DisagreementSection disagreements={synthesis.disagreement} />
        <ListSection title="Kill conditions" items={synthesis.killConditions} />
        <ListSection title="Open questions" items={synthesis.openQuestions} />
      </div>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-zinc-200">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-zinc-500">–</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DisagreementSection({ disagreements }: { disagreements: Synthesis["disagreement"] }) {
  if (disagreements.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Disagreement</h3>
      <ul className="mt-2 space-y-3 text-sm text-zinc-200">
        {disagreements.map((disagreement, index) => (
          <li key={index}>
            <p className="font-medium text-zinc-100">{disagreement.topic}</p>
            <ul className="mt-1 space-y-1 pl-3 text-zinc-300">
              {disagreement.sides.map((side, sideIndex) => (
                <li key={sideIndex} className="flex gap-2">
                  <span className="text-zinc-500">–</span>
                  <span>{side}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
