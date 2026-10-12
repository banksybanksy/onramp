"use client";

import { AGENCY_ORDER } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Agency } from "@/types";

export interface ActiveFilters {
  transit: boolean;
  traffic: boolean;
  cameras: boolean;
  agencies: Agency[];
}

interface FilterChipsRowProps {
  filters: ActiveFilters;
  onToggleFilter: (key: keyof Omit<ActiveFilters, "agencies">) => void;
  onToggleAgency: (agency: Agency) => void;
}

const LAYER_BUTTONS: Array<{
  key: keyof Omit<ActiveFilters, "agencies">;
  label: string;
  activeClass: string;
}> = [
  {
    key: "traffic",
    label: "Traffic",
    activeClass: "bg-rose-600 border-rose-600 text-white"
  },
  {
    key: "transit",
    label: "Transit",
    activeClass: "bg-blue-600 border-blue-600 text-white"
  },
  {
    key: "cameras",
    label: "Cameras",
    activeClass: "bg-violet-600 border-violet-600 text-white"
  }
];

function LayerButton({
  active,
  label,
  activeClass,
  onClick
}: {
  active: boolean;
  label: string;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cw-reflect-button h-8 rounded-full border px-4 text-[12px] font-semibold tracking-[0.01em] transition",
        active
          ? activeClass
          : "border-slate-200 bg-white/80 text-slate-500 hover:border-slate-300 hover:text-slate-700"
      )}
    >
      {label}
    </button>
  );
}

function AgencyChip({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cw-reflect-button h-7 rounded-full border px-3 text-[11px] font-medium tracking-[0.01em] transition",
        active
          ? "border-blue-500/80 bg-blue-50 text-blue-700"
          : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-slate-300 hover:text-slate-700"
      )}
    >
      {label}
    </button>
  );
}

export function FilterChipsRow({ filters, onToggleFilter, onToggleAgency }: FilterChipsRowProps) {
  const allAgenciesOn = AGENCY_ORDER.every((a) => filters.agencies.includes(a));

  const handleToggleAllAgencies = () => {
    if (allAgenciesOn) {
      AGENCY_ORDER.forEach((a) => {
        if (filters.agencies.includes(a)) onToggleAgency(a);
      });
    } else {
      AGENCY_ORDER.forEach((a) => {
        if (!filters.agencies.includes(a)) onToggleAgency(a);
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {LAYER_BUTTONS.map(({ key, label, activeClass }) => (
          <LayerButton
            key={key}
            active={filters[key]}
            label={label}
            activeClass={activeClass}
            onClick={() => onToggleFilter(key)}
          />
        ))}
      </div>

      {/* Agency chips only apply to transit, so they collapse with it. `inert`
          keeps the hidden chips out of the tab order. */}
      <div
        inert={!filters.transit}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          filters.transit ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pt-0.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Agencies
            </span>
            <button
              type="button"
              onClick={handleToggleAllAgencies}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-blue-600 transition hover:text-blue-700"
            >
              {allAgenciesOn ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AGENCY_ORDER.map((agency) => (
              <AgencyChip
                key={agency}
                active={filters.agencies.includes(agency)}
                label={agency}
                onClick={() => onToggleAgency(agency)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
