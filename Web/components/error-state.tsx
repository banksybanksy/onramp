"use client";

interface ErrorStateProps {
  message: string;
  retrying: boolean;
  onRetry: () => void;
}

export function ErrorState({ message, retrying, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-[20px] border border-rose-200 bg-[rgba(255,246,244,0.92)] p-5 text-left backdrop-blur-xl"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rose-700">
        Refresh failed
      </p>
      <p className="mt-3 text-sm text-slate-700">
        {message}. The list shows the last data that loaded.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="cw-reflect-button mt-4 rounded-[14px] border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
