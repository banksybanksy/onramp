"use client";

import type { IncidentsResponse } from "@/types";

interface SourceStatusPillsProps {
  sourceStatus: IncidentsResponse["sourceStatus"];
}

const MODE_STYLES = {
  live: {
    pill: "border-emerald-200/80 bg-emerald-50/90",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
    label: "live"
  },
  partial: {
    pill: "border-amber-200/80 bg-amber-50/90",
    dot: "bg-amber-400",
    text: "text-amber-800",
    label: "partial"
  }
} as const;

export function SourceStatusPills({ sourceStatus }: SourceStatusPillsProps) {
  const liveStatuses = Object.values(sourceStatus).filter(
    (s) => s.mode === "live" || s.mode === "partial"
  );

  if (liveStatuses.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {liveStatuses.map((status) => {
        const styles = MODE_STYLES[status.mode as keyof typeof MODE_STYLES];
        return (
          <div
            key={status.key}
            className={`cw-reflect-button flex items-center gap-1.5 rounded-[14px] border px-3 py-2 backdrop-blur-lg ${styles.pill}`}
            title={status.message}
          >
            <span
              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot} ${status.mode === "live" ? "animate-pulse" : ""}`}
            />
            <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${styles.text}`}>
              {status.label} {styles.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
