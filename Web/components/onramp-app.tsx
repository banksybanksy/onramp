"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { CorridorFilter } from "@/components/corridor-filter";
import { CameraPanel } from "@/components/camera-panel";
import { DetailPanel } from "@/components/detail-panel";
import { type ActiveFilters, FilterChipsRow } from "@/components/filter-chips-row";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { IncidentCard } from "@/components/incident-card";
import { MapCanvas, type MapState } from "@/components/map-canvas";
import { MapNotice } from "@/components/map-notice";
import { SourceStatusPills } from "@/components/source-status-pills";
import { AGENCY_ORDER, APP_NAME, PUBLIC_CONFIG } from "@/lib/config";
import { buildStraightRoute, lineDistanceKm, NO_TIMESTAMP_MINUTES } from "@/lib/geo";
import { useIncidentNotifications } from "@/features/incidents/use-incident-notifications";
import { useNotificationPreference } from "@/features/incidents/use-notification-preference";
import { useIncidents } from "@/features/map/use-incidents";
import type { GeocodeCandidate, Incident, IncidentsResponse } from "@/types";

// Incidents older than 6 hours are hidden.
const FRESHNESS_LIMIT_MINUTES = 360;
const MAX_LISTED_INCIDENTS = 12;

// Planned, long-running roadwork is hidden: it is not news to a commuter.
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
  agencies: AGENCY_ORDER
};

interface OnrampAppProps {
  initialData: IncidentsResponse;
}

export function OnrampApp({ initialData }: OnrampAppProps) {
  const { data, loading, error, refresh } = useIncidents({ initialData });
  const { notificationPreference, updateNotificationPreference } = useNotificationPreference();
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [locateSignal, setLocateSignal] = useState(0);
  const [corridorOrigin, setCorridorOrigin] = useState<GeocodeCandidate | null>(null);
  const [corridorDestination, setCorridorDestination] = useState<GeocodeCandidate | null>(null);
  const [mapState, setMapState] = useState<MapState>(
    PUBLIC_CONFIG.mapboxToken ? "loading" : "missing-token"
  );

  const deferredFilters = useDeferredValue(filters);

  const corridorPath = useMemo(() => {
    if (!corridorOrigin || !corridorDestination) return null;
    return buildStraightRoute(corridorOrigin.coordinate, corridorDestination.coordinate, 48);
  }, [corridorOrigin, corridorDestination]);

  const visibleIncidents = useMemo(() => {
    return data.incidents.filter((incident) => {
      // Records with no timestamp are kept rather than silently dropped.
      const isFresh =
        incident.freshnessMinutes === NO_TIMESTAMP_MINUTES ||
        incident.freshnessMinutes <= FRESHNESS_LIMIT_MINUTES;
      if (!isFresh) return false;

      if (isLongTermPlanned(incident)) return false;

      if (!deferredFilters.transit && incident.isTransit) return false;
      if (!deferredFilters.traffic && incident.isTraffic) return false;

      // Agency chips only filter the agencies they name. Alerts from operators
      // without a chip ("Other") stay visible instead of disappearing.
      if (
        incident.isTransit &&
        AGENCY_ORDER.includes(incident.agency) &&
        !deferredFilters.agencies.includes(incident.agency)
      ) {
        return false;
      }

      if (
        corridorPath &&
        lineDistanceKm(incident.coordinate, corridorPath) > PUBLIC_CONFIG.corridorKm
      ) {
        return false;
      }

      return true;
    });
  }, [data.incidents, deferredFilters, corridorPath]);

  const visibleCameras = useMemo(() => {
    if (!deferredFilters.cameras) return [];
    if (!corridorPath) return data.cameras;
    return data.cameras.filter(
      (camera) => lineDistanceKm(camera.coordinate, corridorPath) <= PUBLIC_CONFIG.corridorKm
    );
  }, [deferredFilters.cameras, data.cameras, corridorPath]);

  const selectedIncident =
    data.incidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const selectedCamera = data.cameras.find((camera) => camera.id === selectedCameraId) ?? null;

  const selectIncident = (incidentId: string) => {
    startTransition(() => {
      setSelectedIncidentId(incidentId);
      setSelectedCameraId(null);
    });
  };

  useIncidentNotifications({
    incidents: data.incidents,
    notificationPreference,
    onSelectIncident: selectIncident,
    onPreferenceChange: updateNotificationPreference
  });

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#dbe5ea] text-slate-900">
      <div className="absolute inset-0">
        <MapCanvas
          incidents={visibleIncidents}
          cameras={visibleCameras}
          selectedIncidentId={selectedIncidentId}
          recenterSignal={recenterSignal}
          locateSignal={locateSignal}
          onSelectIncident={selectIncident}
          onMapStateChange={setMapState}
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
              {mapState === "ready" ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 lg:max-w-[420px]">
          <MapNotice state={mapState} />

          {error ? <ErrorState message={error} retrying={loading} onRetry={refresh} /> : null}

          {visibleIncidents.length === 0 ? (
            <EmptyState
              title="Nothing matches these filters"
              description="Try widening the filters or clearing the route filter."
            />
          ) : (
            <div className="cw-scrollbar-none grid max-h-[38dvh] gap-3 overflow-y-auto overscroll-contain">
              {visibleIncidents.slice(0, MAX_LISTED_INCIDENTS).map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  selected={incident.id === selectedIncidentId}
                  onClick={() => selectIncident(incident.id)}
                />
              ))}
              {visibleIncidents.length > MAX_LISTED_INCIDENTS ? (
                <p className="px-1 text-xs text-slate-600">
                  Showing {MAX_LISTED_INCIDENTS} of {visibleIncidents.length}, most severe first.
                  The map shows all of them.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <DetailPanel incident={selectedIncident} onClose={() => setSelectedIncidentId(null)} />

      <CameraPanel camera={selectedCamera} onClose={() => setSelectedCameraId(null)} />
    </main>
  );
}
