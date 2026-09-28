import { useState, type FormEvent, type KeyboardEvent } from "react";

interface ProblemInputProps {
  onSubmit: (problem: string) => void;
}

export function ProblemInput({ onSubmit }: ProblemInputProps) {
  const [problem, setProblem] = useState("");
  const trimmed = problem.trim();

  function submit() {
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl px-6">
      <label htmlFor="problem" className="block text-sm font-medium text-zinc-700">
        What should the team investigate?
      </label>
      <textarea
        id="problem"
        value={problem}
        onChange={(event) => setProblem(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Should we build real-time collaboration into our developer platform?"
        rows={6}
        className="mt-3 w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-zinc-400 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-900"
      />
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-zinc-400">⌘ + Enter to submit</p>
        <button
          type="submit"
          disabled={!trimmed}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          Deliberate
        </button>
      </div>
    </form>
  );
}
