"use client";

import { SEVERITY_STYLES } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types";

interface SeverityBadgeProps {
  severity: Severity;
  compact?: boolean;
}

export function SeverityBadge({ severity, compact = false }: SeverityBadgeProps) {
  const style = SEVERITY_STYLES[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full ring-1 ring-inset",
        style.accent,
        style.ring,
        compact
          ? "px-2 py-1 text-[10px] font-semibold tracking-[0.04em]"
          : "px-3 py-1.5 text-xs font-semibold tracking-[0.05em]"
      )}
    >
      {style.label}
    </span>
  );
}
