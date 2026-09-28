interface RunErrorProps {
  message: string;
  onReset: () => void;
}

export function RunError({ message, onReset }: RunErrorProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        New deliberation
      </button>
    </div>
  );
}
