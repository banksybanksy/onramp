"use client";

import { useState } from "react";

import { PUBLIC_CONFIG } from "@/lib/config";
import { useGeocodeSuggestions } from "@/features/route/use-geocode-suggestions";
import type { GeocodeCandidate } from "@/types";

interface LocationPickerProps {
  id: string;
  label: string;
  placeholder: string;
  selected: GeocodeCandidate | null;
  onSelect: (candidate: GeocodeCandidate) => void;
  onClear: () => void;
}

function LocationPicker({
  id,
  label,
  placeholder,
  selected,
  onSelect,
  onClear
}: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Only fetch suggestions when no location is locked in.
  const { results: allResults } = useGeocodeSuggestions(selected ? "" : query);
  const results = allResults.slice(0, 5);
  const showDropdown = open && !selected && results.length > 0;
  const listId = `${id}-suggestions`;

  const choose = (candidate: GeocodeCandidate) => {
    onSelect(candidate);
    setQuery("");
    setOpen(false);
  };

  if (selected) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5">
        <span
          className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800"
          title={selected.label}
        >
          <span className="sr-only">{label}: </span>
          {selected.label}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="shrink-0 text-slate-500 transition hover:text-slate-800"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              d="M1 1l8 8M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-activedescendant={showDropdown ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!showDropdown) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((index) => (index + step + results.length) % results.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            choose(results[Math.min(activeIndex, results.length - 1)]);
          } else if (event.key === "Escape") {
            event.stopPropagation();
            setOpen(false);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-full rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[12px] text-slate-700 placeholder-slate-500 outline-none transition focus:border-slate-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/30 [@media(pointer:coarse)]:text-base"
      />
      {showDropdown ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xl"
        >
          {results.map((result, index) => (
            <li
              key={result.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown, not click: it fires before the input's blur closes the list.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(result);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex cursor-pointer items-baseline gap-2 px-4 py-2.5 ${index === activeIndex ? "bg-slate-50" : ""}`}
            >
              <span className="shrink-0 text-[13px] font-semibold text-slate-800">
                {result.label}
              </span>
              {result.context ? (
                <span className="truncate text-[11px] text-slate-500">{result.context}</span>
              ) : null}
            </li>
          ))}
        </ul>
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
          id="route-from"
          label="From"
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
          <path
            d="M1 5h12M9 1l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <LocationPicker
          id="route-to"
          label="To"
          placeholder="To…"
          selected={destination}
          onSelect={onDestinationChange}
          onClear={() => onDestinationChange(null)}
        />
      </div>
      {isActive && !(origin && destination) ? (
        <p className="text-[11px] text-slate-600">
          Set both ends to keep incidents within {PUBLIC_CONFIG.corridorKm} km of a straight line
          between them.
        </p>
      ) : null}
    </div>
  );
}
