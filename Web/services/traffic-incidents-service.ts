import { computeFreshnessMinutes, resolveCoordinateFromText } from "@/lib/geo";
import { logger } from "@/lib/logger";
import { getSampleTrafficIncidents } from "@/lib/sample-data";
import { pickFirstString, toArray, uniqueBy } from "@/lib/utils";
import { SERVER_CONFIG } from "@/lib/config";
import { fetchJson } from "@/services/fetch-json";
import type { ServiceResult, TrafficIncident } from "@/types";

type TrafficPayload = Record<string, unknown> | unknown[];

function getRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getArrayOfRecords(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Record<string, unknown>[];
  }

  return value
    .map((item) => getRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));
}

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

function extractTrafficItems(payload: TrafficPayload) {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }

  if ("incidents" in payload && Array.isArray(payload.incidents)) {
    return payload.incidents.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object"
    );
  }

  if ("events" in payload && Array.isArray(payload.events)) {
    return payload.events.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object"
    );
  }

  if ("features" in payload && Array.isArray(payload.features)) {
    return payload.features.flatMap((feature) => {
      if (!feature || typeof feature !== "object" || !("properties" in feature)) {
        return [];
      }

      return [
        {
          ...((feature as { properties?: Record<string, unknown> }).properties ?? {}),
          coordinate:
            feature &&
            typeof feature === "object" &&
            "geometry" in feature &&
            feature.geometry &&
            typeof feature.geometry === "object" &&
            Array.isArray((feature.geometry as { coordinates?: unknown[] }).coordinates)
              ? {
                  lng: Number(
                    ((feature.geometry as { coordinates: unknown[] }).coordinates[0] as number) ?? 0
                  ),
                  lat: Number(
                    ((feature.geometry as { coordinates: unknown[] }).coordinates[1] as number) ?? 0
                  )
                }
              : undefined
        } satisfies Record<string, unknown>
      ];
    });
  }

  return [];
}

function normalizeTrafficItem(item: Record<string, unknown>) {
  const roads = [
    ...getArrayOfRecords(item.roads),
    ...getArrayOfRecords(item.roadways)
  ];
  const geography = getRecord(item.geography);
  const geometryCoordinate =
    parsePoint(item.coordinate) ??
    parsePoint(item.geometry) ??
    parsePoint(geography?.coordinates) ??
    parsePoint(geography);
  const title = pickFirstString(item.title, item.headline, item.eventType, item.description);
  const description = pickFirstString(item.description, item.details, item.comment, title);
  const coordinate = geometryCoordinate ??
    (item.location && typeof item.location === "object"
      ? {
          lat: Number((item.location as { lat?: unknown }).lat),
          lng: Number((item.location as { lng?: unknown }).lng)
        }
      : resolveCoordinateFromText(`${title} ${description}`));
  const roadNames = uniqueBy(
    [
      ...toArray(item.roadNames).map((value) => String(value)),
      ...toArray(item.freeways).map((value) => String(value)),
      ...roads.map((road) => pickFirstString(road.name, road.route, road.direction)).filter(Boolean),
      pickFirstString(item.roadway)
    ].filter(Boolean),
    (road) => road
  );

  return {
    id: pickFirstString(item.id, item.eventId, item.guid, `${title}-${coordinate.lat}-${coordinate.lng}`),
    title: title || "Traffic incident",
    subtitle: pickFirstString(
      item.subtitle,
      item.event_subtype,
      item.eventType,
      roads
        .map((road) =>
          [pickFirstString(road.name, road.route), pickFirstString(road.from), pickFirstString(road.to)]
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
    if (!SERVER_CONFIG.trafficFeed.url) {
      const sampleIncidents = getSampleTrafficIncidents();
      return {
        data: sampleIncidents,
        sourceStatus: {
          key: "traffic",
          label: "Traffic",
          ok: true,
          mode: "fallback",
          itemCount: sampleIncidents.length,
          updatedAt: new Date().toISOString(),
          message:
            "Using bundled traffic incident sample data. Add BAY_511_API_KEY to enable official 511 SF Bay roadway alerts."
        },
        warnings: []
      };
    }

    try {
      const payload = await fetchJson<TrafficPayload>(SERVER_CONFIG.trafficFeed.url);
      const liveIncidents = uniqueBy(
        extractTrafficItems(payload).map((item) => normalizeTrafficItem(item)),
        (incident) => incident.id
      ).sort((a, b) => {
        return computeFreshnessMinutes(a.startTime) - computeFreshnessMinutes(b.startTime);
      });

      if (liveIncidents.length === 0) {
        const sampleIncidents = getSampleTrafficIncidents();
        return {
          data: sampleIncidents,
          sourceStatus: {
            key: "traffic",
            label: "Traffic",
            ok: false,
            mode: "fallback",
            itemCount: sampleIncidents.length,
            updatedAt: new Date().toISOString(),
            endpoint: SERVER_CONFIG.trafficFeed.url,
            message:
              "Configured traffic feed returned no usable incidents. Showing sample roadway events."
          },
          warnings: ["Traffic feed returned no usable incidents"]
        };
      }

      return {
        data: liveIncidents,
        sourceStatus: {
          key: "traffic",
          label: "Traffic",
          ok: true,
          mode: "live",
          itemCount: liveIncidents.length,
          updatedAt: new Date().toISOString(),
          endpoint: SERVER_CONFIG.trafficFeed.url,
          message: "Live traffic incidents active"
        },
        warnings: []
      };
    } catch (error) {
      logger.error("TrafficIncidentsService", "Falling back to sample traffic incidents", error);
      const sampleIncidents = getSampleTrafficIncidents();
      return {
        data: sampleIncidents,
        sourceStatus: {
          key: "traffic",
          label: "Traffic",
          ok: false,
          mode: "fallback",
          itemCount: sampleIncidents.length,
          updatedAt: new Date().toISOString(),
          endpoint: SERVER_CONFIG.trafficFeed.url,
          message: `Traffic feed failed: ${String(error)}`
        },
        warnings: [String(error)]
      };
    }
  }
}
