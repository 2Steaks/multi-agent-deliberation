interface SynthesisErrorProps {
  message: string;
  onRetry: () => void;
}

export function SynthesisError({ message, onRetry }: SynthesisErrorProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        Retry synthesis
      </button>
    </div>
  );
}
