export function SynthesizingIndicator() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white py-12 text-center shadow-sm">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-zinc-500" />
      </span>
      <p className="text-sm font-medium tracking-wide text-zinc-600 uppercase">Synthesizing</p>
    </div>
  );
}
