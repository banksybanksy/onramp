"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { CorridorFilter } from "@/components/corridor-filter";
import { CameraPanel } from "@/components/camera-panel";
import { DetailPanel } from "@/components/detail-panel";
import {
  type ActiveFilters,
  FilterChipsRow
} from "@/components/filter-chips-row";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { IncidentCard } from "@/components/incident-card";
import { MapCanvas } from "@/components/map-canvas";
import { SourceStatusPills } from "@/components/source-status-pills";
import { APP_NAME } from "@/lib/config";
import { buildStraightRoute, lineDistanceKm } from "@/lib/geo";
import { useCommute } from "@/features/commute/use-commute";
import { useIncidentNotifications } from "@/features/incidents/use-incident-notifications";
import { useIncidents } from "@/features/map/use-incidents";
import type { GeocodeCandidate, Incident, IncidentsResponse } from "@/types";

// Auto-hide incidents older than 6 hours.
const FRESHNESS_LIMIT_MINUTES = 360;
// freshnessMinutes sentinel for "no timestamp" — always keep these.
const NO_TIMESTAMP_SENTINEL = 9000;
// Corridor width for route-based filtering (km on each side of the straight line).
const CORRIDOR_KM = 5;

// Keywords that indicate a planned, long-term construction event rather than an
// active incident. These are filtered out automatically.
const LONG_TERM_KEYWORDS = [
  "construction project",
  "improvement project",
  "freeway improvement",
  "highway improvement",
  "bridge project",
  "long-term",
  "long term",
  "scheduled maintenance",
  "planned closure",
  "paving project",
  "utility relocation",
  "widening project",
  "roadway project"
];

function isLongTermPlanned(incident: Incident): boolean {
  const text = `${incident.title} ${incident.subtitle}`.toLowerCase();
  return LONG_TERM_KEYWORDS.some((kw) => text.includes(kw));
}

const initialFilters: ActiveFilters = {
  transit: true,
  traffic: true,
  cameras: true,
  agencies: ["BART", "Muni", "Caltrain", "AC Transit", "VTA", "SamTrans"]
};

interface CommuteWatchAppProps {
  initialData: IncidentsResponse;
}

export function CommuteWatchApp({ initialData }: CommuteWatchAppProps) {
  const { data, loading, error, refresh } = useIncidents({ initialData });
  const { notificationPreference, updateNotificationPreference } = useCommute();
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [locateSignal, setLocateSignal] = useState(0);
  const [corridorOrigin, setCorridorOrigin] = useState<GeocodeCandidate | null>(null);
  const [corridorDestination, setCorridorDestination] = useState<GeocodeCandidate | null>(null);

  const deferredFilters = useDeferredValue(filters);

  // Pre-compute corridor path once both endpoints are set.
  const corridorPath = useMemo(() => {
    if (!corridorOrigin || !corridorDestination) return null;
    return buildStraightRoute(
      corridorOrigin.coordinate,
      corridorDestination.coordinate,
      48
    );
  }, [corridorOrigin, corridorDestination]);

  const visibleIncidents = useMemo(() => {
    return data.incidents.filter((incident) => {
      // 6-hour freshness gate.
      const isFresh =
        incident.freshnessMinutes >= NO_TIMESTAMP_SENTINEL ||
        incident.freshnessMinutes <= FRESHNESS_LIMIT_MINUTES;
      if (!isFresh) return false;

      // Drop long-term planned construction.
      if (isLongTermPlanned(incident)) return false;

      // Layer toggles.
      if (!deferredFilters.transit && incident.isTransit) return false;
      if (!deferredFilters.traffic && incident.isTraffic) return false;

      // Transit agency filter.
      if (
        incident.isTransit &&
        deferredFilters.agencies.length > 0 &&
        !deferredFilters.agencies.includes(incident.agency)
      ) {
        return false;
      }

      // Corridor filter — when both endpoints are set, only show incidents
      // within CORRIDOR_KM of the straight line between them.
      if (corridorPath) {
        const dist = lineDistanceKm(incident.coordinate, corridorPath);
        if (dist > CORRIDOR_KM) return false;
      }

      return true;
    });
  }, [data.incidents, deferredFilters, corridorPath]);

  const visibleCameras = useMemo(() => {
    if (!deferredFilters.cameras) return [];
    if (!corridorPath) return data.cameras;
    // When a corridor is active, only show cameras near the route.
    return data.cameras.filter(
      (camera) => lineDistanceKm(camera.coordinate, corridorPath) <= CORRIDOR_KM
    );
  }, [deferredFilters.cameras, data.cameras, corridorPath]);

  const selectedIncident =
    data.incidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const selectedCamera =
    data.cameras.find((camera) => camera.id === selectedCameraId) ?? null;

  useIncidentNotifications({
    incidents: data.incidents,
    notificationPreference,
    onSelectIncident: (incidentId) => {
      startTransition(() => setSelectedIncidentId(incidentId));
    },
    onPreferenceChange: updateNotificationPreference
  });

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#dbe5ea] text-slate-900">
      <div className="absolute inset-0">
        <MapCanvas
          incidents={visibleIncidents}
          cameras={visibleCameras}
          selectedIncidentId={selectedIncidentId}
          recenterSignal={recenterSignal}
          locateSignal={locateSignal}
          onSelectIncident={(incidentId) => {
            startTransition(() => {
              setSelectedIncidentId(incidentId);
              setSelectedCameraId(null);
            });
          }}
          onSelectCamera={(cameraId) => {
            startTransition(() => {
              setSelectedCameraId(cameraId);
              setSelectedIncidentId(null);
            });
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(231,238,242,0.45)_0%,rgba(231,238,242,0)_26%,rgba(211,220,225,0.18)_100%)]" />

      <section className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,460px)_1fr]">
          <div className="pointer-events-auto rounded-[28px] border border-slate-300/80 bg-[rgba(255,251,244,0.88)] p-4 shadow-[0_18px_60px_rgba(43,57,76,0.12)] backdrop-blur-2xl">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Bay Area transit &amp; traffic
              </p>
              <h1 className="mt-2 text-[clamp(1.7rem,3vw,2.35rem)] font-semibold tracking-tight text-slate-900">
                {APP_NAME}
              </h1>
            </div>

            <div className="mt-4">
              <CorridorFilter
                origin={corridorOrigin}
                destination={corridorDestination}
                onOriginChange={setCorridorOrigin}
                onDestinationChange={setCorridorDestination}
              />
            </div>

            <div className="mt-4">
              <FilterChipsRow
                filters={filters}
                onToggleFilter={(key) =>
                  setFilters((current) => ({ ...current, [key]: !current[key] }))
                }
                onToggleAgency={(agency) =>
                  setFilters((current) => ({
                    ...current,
                    agencies: current.agencies.includes(agency)
                      ? current.agencies.filter((item) => item !== agency)
                      : [...current.agencies, agency]
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-start justify-end gap-3">
            <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
              <SourceStatusPills sourceStatus={data.sourceStatus} />
              <button
                type="button"
                onClick={() => setRecenterSignal((value) => value + 1)}
                className="cw-reflect-button rounded-[14px] border border-slate-300/80 bg-[rgba(255,255,255,0.84)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur-xl transition hover:border-slate-400 hover:bg-white"
              >
                Center map
              </button>
              <button
                type="button"
                onClick={() => setLocateSignal((value) => value + 1)}
                className="cw-reflect-button rounded-[14px] border border-slate-300/80 bg-[rgba(255,255,255,0.84)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur-xl transition hover:border-slate-400 hover:bg-white"
              >
                My location
              </button>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 lg:max-w-[420px]">
          {error ? <ErrorState message={error} onRetry={refresh} /> : null}

          {loading ? (
            <div className="rounded-[20px] border border-slate-300 bg-[rgba(255,255,255,0.82)] p-5 text-sm text-slate-600 backdrop-blur-xl">
              Refreshing live incidents…
            </div>
          ) : null}

          {visibleIncidents.length === 0 ? (
            <EmptyState
              title="Nothing matches these filters"
              description="Try widening the filters or clearing the route filter."
            />
          ) : (
            <div className="cw-scrollbar-none grid max-h-[38vh] gap-3 overflow-y-auto">
              {visibleIncidents.slice(0, 12).map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  selected={incident.id === selectedIncidentId}
                  onClick={() => {
                    startTransition(() => setSelectedIncidentId(incident.id));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <DetailPanel
        incident={selectedIncident}
        onClose={() => setSelectedIncidentId(null)}
      />

      <CameraPanel
        camera={selectedCamera}
        onClose={() => setSelectedCameraId(null)}
      />
    </main>
  );
}
