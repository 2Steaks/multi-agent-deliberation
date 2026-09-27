import { useState } from "react";
import type { Stance, SpecialistState } from "../lib/types";

const STANCE_STYLES: Record<Stance, string> = {
  support: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  oppose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  conditional: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

interface SpecialistCardProps {
  specialist: SpecialistState;
}

export function SpecialistCard({ specialist }: SpecialistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = specialist.status === "complete";

  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
      <button
        type="button"
        onClick={() => canExpand && setExpanded((value) => !value)}
        disabled={!canExpand}
        aria-expanded={expanded}
        className="flex w-full flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-default"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-900">{specialist.role}</span>
          <StatusIndicator status={specialist.status} />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{specialist.description}</p>

        {specialist.status === "complete" && specialist.result && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STANCE_STYLES[specialist.result.stance]}`}
              >
                {specialist.result.stance}
              </span>
              <span className="text-xs text-zinc-500">{formatDuration(specialist.durationMs ?? 0)}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{specialist.result.keyPoints[0]}</p>
          </>
        )}
      </button>

      {expanded && specialist.result && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4 text-sm">
          <DetailList title="Key points" items={specialist.result.keyPoints} />
          <DetailList title="Risks" items={specialist.result.risks} />
          <DetailList title="Questions" items={specialist.result.questions} />
        </div>
      )}
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</h4>
      <ul className="mt-1.5 space-y-1.5 text-zinc-600">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-zinc-300">–</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIndicator({ status }: { status: SpecialistState["status"] }) {
  if (status === "waiting") {
    return <span className="text-xs text-zinc-400">Waiting</span>;
  }
  if (status === "thinking") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
        Thinking...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
      <CheckIcon />
      Complete
    </span>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
