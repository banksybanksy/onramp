"use client";

import { useState } from "react";

import { useGeocodeSuggestions } from "@/features/commute/use-geocode-suggestions";
import type { GeocodeCandidate } from "@/types";

interface LocationPickerProps {
  placeholder: string;
  selected: GeocodeCandidate | null;
  onSelect: (candidate: GeocodeCandidate) => void;
  onClear: () => void;
}

function LocationPicker({ placeholder, selected, onSelect, onClear }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // Only fetch suggestions when no location is locked in.
  const { results } = useGeocodeSuggestions(selected ? "" : query);
  const showDropdown = open && !selected && results.length > 0;

  if (selected) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5">
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800">
          {selected.label}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear"
          className="shrink-0 text-slate-400 transition hover:text-slate-700"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[12px] text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
      />
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xl">
          {results.slice(0, 5).map((result) => (
            <button
              key={result.id}
              type="button"
              onMouseDown={() => {
                onSelect(result);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-baseline gap-2 px-4 py-2.5 text-left transition hover:bg-slate-50"
            >
              <span className="text-[13px] font-semibold text-slate-800">{result.label}</span>
              {result.context ? (
                <span className="truncate text-[11px] text-slate-400">{result.context}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface CorridorFilterProps {
  origin: GeocodeCandidate | null;
  destination: GeocodeCandidate | null;
  onOriginChange: (candidate: GeocodeCandidate | null) => void;
  onDestinationChange: (candidate: GeocodeCandidate | null) => void;
}

export function CorridorFilter({
  origin,
  destination,
  onOriginChange,
  onDestinationChange
}: CorridorFilterProps) {
  const isActive = origin !== null || destination !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
          Route filter
        </span>
        {isActive ? (
          <button
            type="button"
            onClick={() => {
              onOriginChange(null);
              onDestinationChange(null);
            }}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-600 transition hover:text-rose-700"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <LocationPicker
          placeholder="From…"
          selected={origin}
          onSelect={onOriginChange}
          onClear={() => onOriginChange(null)}
        />
        <svg
          width="14"
          height="10"
          viewBox="0 0 14 10"
          fill="none"
          className="shrink-0 text-slate-400"
          aria-hidden="true"
        >
          <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <LocationPicker
          placeholder="To…"
          selected={destination}
          onSelect={onDestinationChange}
          onClear={() => onDestinationChange(null)}
        />
      </div>
    </div>
  );
}
