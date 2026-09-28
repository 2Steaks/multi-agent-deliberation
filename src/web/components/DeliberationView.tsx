import type { DeliberationSnapshot, SpecialistId } from "../lib/types";
import { RunError } from "./RunError";
import { SpecialistCard } from "./SpecialistCard";
import { SynthesisError } from "./SynthesisError";
import { SynthesisPanel } from "./SynthesisPanel";
import { SynthesizingIndicator } from "./SynthesizingIndicator";

const STATUS_LABEL: Record<DeliberationSnapshot["status"], string> = {
  running: "Running",
  synthesizing: "Synthesizing",
  done: "Complete",
  error: "Failed",
};

interface DeliberationViewProps {
  snapshot: DeliberationSnapshot;
  onReset: () => void;
  onRetrySpecialist: (id: SpecialistId) => void;
  onRetrySynthesis: () => void;
}

export function DeliberationView({ snapshot, onReset, onRetrySpecialist, onRetrySynthesis }: DeliberationViewProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-16">
      <div className="mb-6 border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-mono text-sm font-medium tracking-wide text-zinc-900">
            DELIBERATION #{String(snapshot.runNumber).padStart(3, "0")}
          </h2>
          <p className="text-sm text-zinc-500">
            5 perspectives · {STATUS_LABEL[snapshot.status]}
          </p>
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-zinc-500">
          {snapshot.problem}
        </p>
      </div>

      {snapshot.status === "error" ? (
        <RunError message={snapshot.error ?? "The deliberation could not be completed."} onReset={onReset} />
      ) : (
        <>
          <div className="grid grid-cols-2 items-start gap-4">
            {snapshot.specialists.map((specialist) => (
              <SpecialistCard key={specialist.id} specialist={specialist} onRetry={onRetrySpecialist} />
            ))}
          </div>

          {snapshot.synthesis.status !== "idle" && (
            <div className="mt-10">
              {snapshot.synthesis.status === "synthesizing" && <SynthesizingIndicator />}
              {snapshot.synthesis.status === "error" && (
                <SynthesisError
                  message={snapshot.synthesis.error ?? "Synthesis failed to complete."}
                  onRetry={onRetrySynthesis}
                />
              )}
              {snapshot.status === "done" && snapshot.synthesis.result && (
                <SynthesisPanel synthesis={snapshot.synthesis.result} />
              )}
            </div>
          )}

          {snapshot.status === "done" && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onReset}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                New deliberation
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
