import { computeFreshnessMinutes, resolveCoordinateFromText } from "@/lib/geo";
import { logger } from "@/lib/logger";
import { getSampleTrafficIncidents } from "@/lib/sample-data";
import { SERVER_CONFIG } from "@/lib/config";
import {
  flattenGeoJsonFeatures,
  getArrayOfRecords,
  getRecord,
  type UnknownRecord
} from "@/lib/records";
import { pickFirstString, toArray, uniqueBy } from "@/lib/utils";
import { fetchJson } from "@/services/fetch-json";
import { describeFailure, resolveSource } from "@/services/source-status";
import type { ServiceResult, TrafficIncident } from "@/types";

function parsePoint(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const [lng, lat] = value.split(",").map((part) => Number(part.trim()));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return null;
  }

  // LineString / MultiPoint geometries: use the first vertex.
  if (Array.isArray(value) && Array.isArray(value[0])) {
    return parsePoint(value[0]);
  }

  if (Array.isArray(value) && value.length >= 2) {
    const lng = Number(value[0]);
    const lat = Number(value[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const record = getRecord(value);
  if (!record) {
    return null;
  }

  if (typeof record.type === "string" && record.type.toLowerCase() === "point") {
    return parsePoint(record.coordinates);
  }

  if (record.latitude !== undefined || record.longitude !== undefined) {
    const lat = Number(record.latitude);
    const lng = Number(record.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  if (record.lat !== undefined || record.lng !== undefined) {
    const lat = Number(record.lat);
    const lng = Number(record.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

function normalizeSeverity(input: unknown): TrafficIncident["severity"] {
  if (typeof input === "number") {
    if (input >= 4) {
      return "critical";
    }
    if (input >= 2) {
      return "major";
    }
    return "minor";
  }

  if (typeof input === "string") {
    const lowercase = input.toLowerCase();
    if (
      lowercase.includes("fatal") ||
      lowercase.includes("full closure") ||
      lowercase.includes("severe") ||
      lowercase.includes("major collision")
    ) {
      return "critical";
    }
    if (
      lowercase.includes("lane blocked") ||
      lowercase.includes("collision") ||
      lowercase.includes("roadwork") ||
      lowercase.includes("major")
    ) {
      return "major";
    }
  }

  return "minor";
}

/** Accepts a bare array, `{ incidents }`, Open511 `{ events }`, or a GeoJSON FeatureCollection. */
export function extractTrafficItems(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return getArrayOfRecords(payload);
  }

  const record = getRecord(payload);
  if (Array.isArray(record?.incidents)) {
    return getArrayOfRecords(record.incidents);
  }

  if (Array.isArray(record?.events)) {
    return getArrayOfRecords(record.events);
  }

  return Array.isArray(record?.features) ? flattenGeoJsonFeatures(record.features) : [];
}

export function normalizeTrafficItem(item: UnknownRecord) {
  const roads = [...getArrayOfRecords(item.roads), ...getArrayOfRecords(item.roadways)];
  const geography = getRecord(item.geography);
  const geometryCoordinate =
    parsePoint(item.coordinate) ??
    parsePoint(item.geometry) ??
    parsePoint(geography?.coordinates) ??
    parsePoint(geography);
  const title = pickFirstString(item.title, item.headline, item.eventType, item.description);
  const description = pickFirstString(item.description, item.details, item.comment, title);
  // Without a usable point, place the event approximately from landmarks in its text.
  const coordinate =
    geometryCoordinate ??
    parsePoint(item.location) ??
    resolveCoordinateFromText(`${title} ${description}`);
  const roadNames = uniqueBy(
    [
      ...toArray(item.roadNames).map((value) => String(value)),
      ...toArray(item.freeways).map((value) => String(value)),
      ...roads
        .map((road) => pickFirstString(road.name, road.route, road.direction))
        .filter(Boolean),
      pickFirstString(item.roadway)
    ].filter(Boolean),
    (road) => road
  );

  return {
    id: pickFirstString(
      item.id,
      item.eventId,
      item.guid,
      `${title}-${coordinate.lat}-${coordinate.lng}`
    ),
    title: title || "Traffic incident",
    subtitle: pickFirstString(
      item.subtitle,
      item.event_subtype,
      item.eventType,
      roads
        .map((road) =>
          [
            pickFirstString(road.name, road.route),
            pickFirstString(road.from),
            pickFirstString(road.to)
          ]
            .filter(Boolean)
            .join(" • ")
        )
        .find(Boolean),
      item.roadway,
      item.locationName,
      "Bay Area roadway"
    ),
    description,
    severity: normalizeSeverity(
      item.severity ??
        item.priority ??
        item.status ??
        item.event_subtype ??
        roads.map((road) => pickFirstString(road.state, road.road_advisory)).join(" ")
    ),
    coordinate,
    startTime: pickFirstString(
      item.startTime,
      item.createdAt,
      item.created,
      item.reportedAt,
      item.updatedAt
    ),
    endTime: pickFirstString(item.endTime, item.clearedAt),
    url: pickFirstString(
      item.url,
      item.moreInfoUrl,
      item.link,
      getArrayOfRecords(item.link)
        .map((link) => pickFirstString(link.href))
        .find(Boolean)
    ),
    source: pickFirstString(item.source, "511 SF Bay Traffic Events"),
    agency: "Other" as const,
    roadNames
  } satisfies TrafficIncident;
}

export class TrafficIncidentsService {
  async getTrafficIncidents(): Promise<ServiceResult<TrafficIncident[]>> {
    const url = SERVER_CONFIG.trafficFeed.url;
    const failures: string[] = [];
    let liveIncidents: TrafficIncident[] = [];

    if (url) {
      try {
        const payload = await fetchJson<unknown>(url);
        liveIncidents = uniqueBy(
          extractTrafficItems(payload).map(normalizeTrafficItem),
          (incident) => incident.id
        ).sort(
          (a, b) => computeFreshnessMinutes(a.startTime) - computeFreshnessMinutes(b.startTime)
        );
      } catch (error) {
        logger.error("TrafficIncidentsService", "Traffic feed failed", error);
        failures.push(`Traffic feed failed: ${describeFailure(error)}.`);
      }
    }

    return resolveSource({
      key: "traffic",
      endpoints: url ? [url] : [],
      liveItems: liveIncidents,
      failures,
      getSample: getSampleTrafficIncidents,
      unconfiguredMessage: "Sample data. Set BAY_511_API_KEY for live 511 traffic events."
    });
  }
}
