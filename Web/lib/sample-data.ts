import cameraFeedRaw from "@/sample-data/cameras.json";
import trafficIncidentsRaw from "@/sample-data/traffic-incidents.json";
import transitAlertsRaw from "@/sample-data/transit-alerts.json";
import type { CameraFeed, TrafficIncident, TransitAlert } from "@/types";

// Sample records are re-dated on every request so they always look recent:
// item i starts (8 + 12i) minutes ago. Otherwise the 6-hour freshness filter
// would hide them all.
const SAMPLE_BASE_OFFSET_MINUTES = 8;
const SAMPLE_STEP_MINUTES = 12;

function freshenTimestamps<T extends { startTime?: string; endTime?: string; updatedAt?: string }>(
  items: T[]
): T[] {
  const now = Date.now();
  return items.map((item, index) => {
    const offsetMs = (SAMPLE_BASE_OFFSET_MINUTES + index * SAMPLE_STEP_MINUTES) * 60_000;
    const startMs = now - offsetMs;
    // Keep the fixture's original duration so endTime never lands before startTime.
    const durationMs =
      item.startTime && item.endTime ? Date.parse(item.endTime) - Date.parse(item.startTime) : NaN;
    return {
      ...item,
      ...(item.startTime !== undefined ? { startTime: new Date(startMs).toISOString() } : {}),
      ...(item.endTime !== undefined
        ? {
            endTime: Number.isFinite(durationMs)
              ? new Date(startMs + durationMs).toISOString()
              : undefined
          }
        : {}),
      ...(item.updatedAt !== undefined
        ? { updatedAt: new Date(now - offsetMs + 90_000).toISOString() }
        : {})
    };
  });
}

export function getSampleTransitAlerts(): TransitAlert[] {
  return freshenTimestamps(transitAlertsRaw as TransitAlert[]);
}

export function getSampleTrafficIncidents(): TrafficIncident[] {
  return freshenTimestamps(trafficIncidentsRaw as TrafficIncident[]);
}

export function getSampleCameras(): CameraFeed[] {
  return freshenTimestamps(cameraFeedRaw as CameraFeed[]);
}
