"use client";

import type { IncidentsResponse, SourceStatus } from "@/types";

interface SourceStatusPillsProps {
  sourceStatus: IncidentsResponse["sourceStatus"];
}

type PillState = "live" | "partial" | "sample" | "failed";

const PILL_STYLES: Record<PillState, { pill: string; dot: string; text: string; label: string }> = {
  live: {
    pill: "border-emerald-200/80 bg-emerald-50/90",
    dot: "bg-emerald-500 motion-safe:animate-pulse",
    text: "text-emerald-800",
    label: "live"
  },
  partial: {
    pill: "border-amber-200/80 bg-amber-50/90",
    dot: "bg-amber-500",
    text: "text-amber-800",
    label: "partial"
  },
  sample: {
    pill: "border-slate-300/80 bg-white/85",
    dot: "bg-slate-400",
    text: "text-slate-600",
    label: "sample"
  },
  // The feed was configured but failed. Sample data is on screen, and the pill
  // must not read like a quiet road.
  failed: {
    pill: "border-rose-200/80 bg-rose-50/90",
    dot: "bg-rose-500",
    text: "text-rose-800",
    label: "failed"
  }
};

function pillState(status: SourceStatus): PillState {
  if (status.mode === "fallback") {
    return status.ok ? "sample" : "failed";
  }

  return status.mode;
}

export function SourceStatusPills({ sourceStatus }: SourceStatusPillsProps) {
  return (
    <ul aria-label="Data sources" className="flex flex-wrap justify-end gap-2">
      {Object.values(sourceStatus).map((status) => {
        const styles = PILL_STYLES[pillState(status)];
        return (
          <li
            key={status.key}
            className={`flex items-center gap-1.5 rounded-[14px] border px-3 py-2 backdrop-blur-lg ${styles.pill}`}
            title={status.message}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.text}`}
            >
              {status.label} {styles.label}
            </span>
            {status.message ? <span className="sr-only">: {status.message}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
