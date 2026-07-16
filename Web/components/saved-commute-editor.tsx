"use client";

import { useEffect, useMemo, useState } from "react";

import { PUBLIC_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useGeocodeSuggestions } from "@/features/commute/use-geocode-suggestions";
import type { Agency, Commute, CommuteLocation, GeocodeCandidate } from "@/types";

const AGENCIES: Agency[] = ["BART", "Muni"];

interface SavedCommuteEditorProps {
  open: boolean;
  commute: Commute | null;
  onClose: () => void;
  onSave: (payload: {
    origin: CommuteLocation;
    destination: CommuteLocation;
    preferredAgencies: Agency[];
  }) => Promise<void>;
  onClear: () => void;
}

function SuggestionList({
  query,
  results,
  loading,
  onSelect
}: {
  query: string;
  results: GeocodeCandidate[];
  loading: boolean;
  onSelect: (candidate: GeocodeCandidate) => void;
}) {
  if (query.trim().length < 2) {
    return null;
  }

  return (
    <div className="mt-2 rounded-[20px] border border-slate-300 bg-[rgba(255,255,255,0.96)] p-2 shadow-[0_12px_30px_rgba(43,57,76,0.14)]">
      {loading ? (
        <p className="px-3 py-2 text-sm text-slate-600">Searching Bay Area places…</p>
      ) : results.length > 0 ? (
        results.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => onSelect(candidate)}
            className="flex w-full flex-col rounded-2xl px-3 py-3 text-left transition hover:bg-slate-100"
          >
            <span className="text-sm font-medium text-slate-900">{candidate.label}</span>
            <span className="text-xs text-slate-500">{candidate.context}</span>
          </button>
        ))
      ) : (
        <p className="px-3 py-2 text-sm text-slate-600">
          No matches found. Enter manual coordinates below if you do not have a Mapbox token.
        </p>
      )}
    </div>
  );
}

export function SavedCommuteEditor({
  open,
  commute,
  onClose,
  onSave,
  onClear
}: SavedCommuteEditorProps) {
  const [originQuery, setOriginQuery] = useState(commute?.origin.label ?? "");
  const [destinationQuery, setDestinationQuery] = useState(commute?.destination.label ?? "");
  const [origin, setOrigin] = useState<CommuteLocation | null>(commute?.origin ?? null);
  const [destination, setDestination] = useState<CommuteLocation | null>(
    commute?.destination ?? null
  );
  const [preferredAgencies, setPreferredAgencies] = useState<Agency[]>(
    commute?.preferredAgencies ?? []
  );
  const [manualOriginLat, setManualOriginLat] = useState(
    commute?.origin.coordinate.lat.toString() ?? ""
  );
  const [manualOriginLng, setManualOriginLng] = useState(
    commute?.origin.coordinate.lng.toString() ?? ""
  );
  const [manualDestinationLat, setManualDestinationLat] = useState(
    commute?.destination.coordinate.lat.toString() ?? ""
  );
  const [manualDestinationLng, setManualDestinationLng] = useState(
    commute?.destination.coordinate.lng.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);

  const originSuggestions = useGeocodeSuggestions(originQuery);
  const destinationSuggestions = useGeocodeSuggestions(destinationQuery);

  const supportsLiveGeocoding = useMemo(() => Boolean(PUBLIC_CONFIG.mapboxToken), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setOriginQuery(commute?.origin.label ?? "");
    setDestinationQuery(commute?.destination.label ?? "");
    setOrigin(commute?.origin ?? null);
    setDestination(commute?.destination ?? null);
    setPreferredAgencies(commute?.preferredAgencies ?? []);
    setManualOriginLat(commute?.origin.coordinate.lat.toString() ?? "");
    setManualOriginLng(commute?.origin.coordinate.lng.toString() ?? "");
    setManualDestinationLat(commute?.destination.coordinate.lat.toString() ?? "");
    setManualDestinationLng(commute?.destination.coordinate.lng.toString() ?? "");
  }, [commute, open]);

  if (!open) {
    return null;
  }

  const buildManualLocations = () => {
    const originLat = Number(manualOriginLat);
    const originLng = Number(manualOriginLng);
    const destinationLat = Number(manualDestinationLat);
    const destinationLng = Number(manualDestinationLng);

    if (
      Number.isFinite(originLat) &&
      Number.isFinite(originLng) &&
      Number.isFinite(destinationLat) &&
      Number.isFinite(destinationLng)
    ) {
      return {
        origin: {
          label: originQuery || "Origin",
          coordinate: { lat: originLat, lng: originLng }
        } satisfies CommuteLocation,
        destination: {
          label: destinationQuery || "Destination",
          coordinate: { lat: destinationLat, lng: destinationLng }
        } satisfies CommuteLocation
      };
    }

    return null;
  };

  const handleSave = async () => {
    const manualLocations = buildManualLocations();
    const nextOrigin = origin ?? manualLocations?.origin ?? null;
    const nextDestination = destination ?? manualLocations?.destination ?? null;

    if (!nextOrigin || !nextDestination) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        origin: nextOrigin,
        destination: nextDestination,
        preferredAgencies
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm">
      <div className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-slate-300 bg-[rgba(251,248,241,0.97)] p-5 shadow-[0_-20px_60px_rgba(43,57,76,0.18)] md:inset-auto md:right-6 md:top-6 md:w-[460px] md:rounded-[28px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Saved commute
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Define your route</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cw-reflect-button rounded-[14px] border border-slate-300 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-400 hover:bg-white/70"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Origin
            </label>
            <input
              value={originQuery}
              onChange={(event) => {
                setOriginQuery(event.target.value);
                setOrigin(null);
              }}
              className="mt-2 w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300"
              placeholder="Downtown Oakland"
            />
            <SuggestionList
              query={originQuery}
              results={originSuggestions.results}
              loading={originSuggestions.loading}
              onSelect={(candidate) => {
                setOrigin(candidate);
                setOriginQuery(candidate.label);
                setManualOriginLat(candidate.coordinate.lat.toString());
                setManualOriginLng(candidate.coordinate.lng.toString());
              }}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Destination
            </label>
            <input
              value={destinationQuery}
              onChange={(event) => {
                setDestinationQuery(event.target.value);
                setDestination(null);
              }}
              className="mt-2 w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300"
              placeholder="Salesforce Transit Center"
            />
            <SuggestionList
              query={destinationQuery}
              results={destinationSuggestions.results}
              loading={destinationSuggestions.loading}
              onSelect={(candidate) => {
                setDestination(candidate);
                setDestinationQuery(candidate.label);
                setManualDestinationLat(candidate.coordinate.lat.toString());
                setManualDestinationLng(candidate.coordinate.lng.toString());
              }}
            />
          </div>

          {!supportsLiveGeocoding ? (
            <div className="rounded-[20px] border border-slate-300 bg-white/70 p-4">
              <p className="text-sm text-slate-700">
                No Mapbox token detected. Add manual coordinates or use sample Bay Area place names.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  value={manualOriginLat}
                  onChange={(event) => setManualOriginLat(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
                  placeholder="Origin lat"
                />
                <input
                  value={manualOriginLng}
                  onChange={(event) => setManualOriginLng(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
                  placeholder="Origin lng"
                />
                <input
                  value={manualDestinationLat}
                  onChange={(event) => setManualDestinationLat(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
                  placeholder="Destination lat"
                />
                <input
                  value={manualDestinationLng}
                  onChange={(event) => setManualDestinationLng(event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
                  placeholder="Destination lng"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Preferred agencies
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGENCIES.map((agency) => {
                const active = preferredAgencies.includes(agency);
                return (
                  <button
                    key={agency}
                    type="button"
                    onClick={() =>
                      setPreferredAgencies((current) =>
                        current.includes(agency)
                          ? current.filter((item) => item !== agency)
                          : [...current, agency]
                      )
                    }
                    className={cn(
                      "cw-reflect-button rounded-[14px] border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                      active
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-300 bg-white text-slate-600"
                    )}
                  >
                    {agency}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="cw-reflect-button rounded-[14px] border border-slate-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-400 hover:bg-white/70"
          >
            Clear route
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="cw-reflect-button rounded-[14px] bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save route"}
          </button>
        </div>
      </div>
    </div>
  );
}
