"use client";

import { formatRelativeMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Incident } from "@/types";

import { SeverityBadge } from "@/components/severity-badge";

interface IncidentCardProps {
  incident: Incident;
  selected?: boolean;
  onClick: () => void;
}

export function IncidentCard({ incident, selected = false, onClick }: IncidentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-[20px] border border-slate-300/55 bg-[rgba(255,255,255,0.58)] p-4 text-left shadow-[0_10px_26px_rgba(50,66,87,0.08)] backdrop-blur-md transition hover:border-slate-400/80 hover:bg-[rgba(255,255,255,0.74)]",
        selected &&
          "border-slate-500 bg-[rgba(255,255,255,0.88)] shadow-[0_16px_36px_rgba(50,66,87,0.14)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
            {incident.agency !== "Other" ? `${incident.agency} • ` : ""}
            {incident.isTransit ? "Transit" : "Traffic"}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">{incident.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{incident.subtitle}</p>
        </div>
        <SeverityBadge severity={incident.severity} compact />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{formatRelativeMinutes(incident.freshnessMinutes)}</span>
        {incident.affectsMyCommute ? (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
            My commute
          </span>
        ) : null}
      </div>
    </button>
  );
}
