"use client";

import type { Commute } from "@/types";

interface CommuteSummaryBannerProps {
  commute: Commute | null;
  relevantIncidentCount: number;
  severeRelevantCount: number;
  onEdit: () => void;
}

export function CommuteSummaryBanner({
  commute,
  relevantIncidentCount,
  severeRelevantCount,
  onEdit
}: CommuteSummaryBannerProps) {
  if (!commute) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-[20px] border border-dashed border-slate-300 bg-[rgba(255,255,255,0.72)] px-4 py-4 text-left transition hover:border-slate-400 hover:bg-[rgba(255,255,255,0.86)]"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
          Saved commute
        </p>
        <p className="mt-2 text-sm font-medium text-slate-900">Save your route</p>
        <p className="mt-1 text-sm text-slate-600">
          Flag the disruptions and cameras that sit closest to your trip.
        </p>
      </button>
    );
  }

  const summary =
    relevantIncidentCount === 0
      ? "Route looks clear right now"
      : `${relevantIncidentCount} active disruption${relevantIncidentCount === 1 ? "" : "s"} affecting your commute`;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-[20px] border border-blue-200 bg-[linear-gradient(90deg,rgba(255,255,255,0.92)_0%,rgba(244,248,255,0.96)_100%)] px-4 py-4 text-left shadow-[0_8px_24px_rgba(40,62,84,0.08)] backdrop-blur-xl transition hover:border-blue-300"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-700">
            My commute
          </p>
          <h2 className="mt-2 text-sm font-semibold text-slate-900">{summary}</h2>
          <p className="mt-1 truncate text-sm text-slate-600">
            {commute.origin.label} → {commute.destination.label}
          </p>
        </div>
        {severeRelevantCount > 0 ? (
          <span className="shrink-0 rounded-[12px] bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">
            {severeRelevantCount} severe
          </span>
        ) : (
          <span className="shrink-0 rounded-[12px] border border-slate-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Edit route
          </span>
        )}
      </div>
    </button>
  );
}
