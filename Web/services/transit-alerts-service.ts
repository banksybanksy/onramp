import { AGENCY_DEFAULT_COORDINATES, SERVER_CONFIG } from "@/lib/config";
import { computeFreshnessMinutes, resolveCoordinateFromText } from "@/lib/geo";
import { logger } from "@/lib/logger";
import { getSampleTransitAlerts } from "@/lib/sample-data";
import { getArrayOfRecords, getRecord, type UnknownRecord } from "@/lib/records";
import { pickFirstString, toArray, uniqueBy } from "@/lib/utils";
import { fetchJson } from "@/services/fetch-json";
import { describeFailure, resolveSource } from "@/services/source-status";
import type { Agency, ServiceResult, TransitAlert } from "@/types";

function getActivePeriodField(item: UnknownRecord, field: "start" | "end") {
  const activePeriods = item.active_period;
  if (!Array.isArray(activePeriods)) {
    return undefined;
  }

  const first = activePeriods[0];
  if (!first || typeof first !== "object") {
    return undefined;
  }

  return (first as UnknownRecord)[field];
}

function normalizeAgency(input: unknown, fallback: Agency): Agency {
  if (typeof input !== "string") {
    return fallback;
  }

  const lowercase = input.toLowerCase();
  if (lowercase.includes("bart")) {
    return "BART";
  }
  if (lowercase.includes("muni") || lowercase.includes("sfmta")) {
    return "Muni";
  }
  if (lowercase.includes("caltrain")) {
    return "Caltrain";
  }
  if (lowercase.includes("ac transit")) {
    return "AC Transit";
  }
  if (lowercase.includes("vta")) {
    return "VTA";
  }
  if (lowercase.includes("samtrans")) {
    return "SamTrans";
  }

  return fallback;
}

function normalizeAgencyId(input: unknown, fallback: Agency): Agency {
  if (typeof input !== "string") {
    return fallback;
  }

  const value = input.trim().toUpperCase();

  switch (value) {
    case "BA":
    case "BART":
      return "BART";
    case "SF":
    case "MUNI":
    case "SFMTA":
      return "Muni";
    case "CT":
    case "CALTRAIN":
      return "Caltrain";
    case "AC":
    case "ACTRANSIT":
      return "AC Transit";
    case "SC":
    case "VTA":
      return "VTA";
    case "SM":
    case "SAMTRANS":
      return "SamTrans";
    default:
      return normalizeAgency(input, fallback);
  }
}

function normalizeSeverity(input: unknown): TransitAlert["severity"] {
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
      lowercase.includes("critical") ||
      lowercase.includes("severe") ||
      lowercase.includes("suspended")
    ) {
      return "critical";
    }
    if (
      lowercase.includes("major") ||
      lowercase.includes("delay") ||
      lowercase.includes("reroute")
    ) {
      return "major";
    }
  }

  return "minor";
}

function getNestedText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  // GTFS-Realtime wraps text as { translation: [{ text, language }] }.
  const translations = getArrayOfRecords(getRecord(value)?.translation);
  const english =
    translations.find((entry) => !entry.language || String(entry.language).startsWith("en")) ??
    translations[0];
  return typeof english?.text === "string" ? english.text : "";
}

function getInformEntityRecords(item: UnknownRecord) {
  return [
    ...getArrayOfRecords(item.informedEntities),
    ...getArrayOfRecords(item.informed_entities),
    ...getArrayOfRecords(item.informed_entity),
    ...getArrayOfRecords(item.informedEntity)
  ];
}

// GTFS-Realtime times are POSIX seconds, sometimes as strings or protobuf
// Long objects ({ low, high }). Convert them to ISO so freshness can be computed.
function getNestedTimeValue(value: unknown): string | undefined {
  const record = getRecord(value);
  const raw = record ? (record.low ?? record.time) : value;

  if (typeof raw === "number" || (typeof raw === "string" && /^\d+$/.test(raw.trim()))) {
    const value = Number(raw);
    // Some feeds send milliseconds; anything past 1e11 is not a plausible seconds value.
    const ms = value > 1e11 ? value : value * 1000;
    return value > 0 ? new Date(ms).toISOString() : undefined;
  }

  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

export function normalizeTransitEntity(item: UnknownRecord, fallbackAgency: Agency) {
  const informedEntities = getInformEntityRecords(item);
  const title = pickFirstString(
    item.title,
    item.headerText ? getNestedText(item.headerText) : "",
    item.header_text ? getNestedText(item.header_text) : "",
    item.summary
  );
  const description = pickFirstString(
    item.description,
    item.descriptionText ? getNestedText(item.descriptionText) : "",
    item.description_text ? getNestedText(item.description_text) : "",
    item.text,
    title
  );
  const detectedAgency = normalizeAgencyId(
    informedEntities[0]?.agency_id ?? informedEntities[0]?.agencyId,
    fallbackAgency
  );

  const agency = normalizeAgencyId(
    item.agency ?? item.agency_id ?? item.operator ?? item.source ?? title ?? description,
    detectedAgency
  );
  const coordinate =
    item.coordinate && typeof item.coordinate === "object"
      ? {
          lat: Number((item.coordinate as { lat?: unknown }).lat),
          lng: Number((item.coordinate as { lng?: unknown }).lng)
        }
      : item.location && typeof item.location === "object"
        ? {
            lat: Number((item.location as { lat?: unknown }).lat),
            lng: Number((item.location as { lng?: unknown }).lng)
          }
        : resolveCoordinateFromText(`${title} ${description}`, agency);

  const safeCoordinate =
    Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng)
      ? coordinate
      : AGENCY_DEFAULT_COORDINATES[agency];

  return {
    id: pickFirstString(
      item.id,
      item.alertId,
      item["entity_id"],
      `${agency}-${title || "alert"}-${safeCoordinate.lat}-${safeCoordinate.lng}`
    ),
    agency,
    title: title || `${agency} Service Advisory`,
    subtitle: pickFirstString(item.subtitle, item.source, item.effect, "Transit service update"),
    description,
    severity: normalizeSeverity(item.severity ?? item.severity_level ?? item.effect ?? item.cause),
    coordinate: safeCoordinate,
    affectedRoutes: uniqueBy(
      [
        ...toArray(item.routes).map((route) => String(route)),
        ...toArray(item.affectedRoutes).map((route) => String(route)),
        ...toArray(item.routeIds).map((route) => String(route)),
        ...informedEntities
          .map((entity) =>
            pickFirstString(entity.routeId, entity.route_id, entity.lineRef, entity.routeShortName)
          )
          .filter(Boolean)
      ],
      (route) => route
    ),
    startTime: pickFirstString(
      item.startTime,
      item.createdAt,
      item.created,
      getNestedTimeValue(getActivePeriodField(item, "start"))
    ),
    endTime: pickFirstString(
      item.endTime,
      item.updatedAt,
      item.updated,
      item.validUntilTime,
      getNestedTimeValue(getActivePeriodField(item, "end"))
    ),
    url: pickFirstString(item.url, item.link, item.moreInfoUrl, getRecord(item.cause_detail)?.url),
    source: pickFirstString(item.source, "511 SF Bay Transit Service Alerts")
  } satisfies TransitAlert;
}

/** Accepts a bare array, `{ alerts: [...] }`, or the GTFS-Realtime `{ entity: [{ id, alert }] }` shape. */
export function extractTransitEntities(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return getArrayOfRecords(payload);
  }

  const record = getRecord(payload);
  if (Array.isArray(record?.alerts)) {
    return getArrayOfRecords(record.alerts);
  }

  return getArrayOfRecords(record?.entity).flatMap((entity) => {
    const alert = getRecord(entity.alert);
    return alert ? [{ ...alert, entity_id: entity.id }] : [];
  });
}

export class TransitAlertsService {
  async getTransitAlerts(): Promise<ServiceResult<TransitAlert[]>> {
    const feeds = SERVER_CONFIG.transitFeeds;
    const failures: string[] = [];

    const settled = await Promise.allSettled(
      feeds.map(async (feed) => {
        const payload = await fetchJson<unknown>(feed.url!);
        return extractTransitEntities(payload).map((item) =>
          normalizeTransitEntity(item, feed.agency)
        );
      })
    );

    const liveAlerts = settled.flatMap((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      logger.warn("TransitAlertsService", "Transit feed failed", result.reason);
      failures.push(`Transit feed failed: ${describeFailure(result.reason)}.`);
      return [];
    });

    return resolveSource({
      key: "transit",
      endpoints: feeds.map((feed) => feed.url!),
      liveItems: uniqueBy(liveAlerts, (alert) => alert.id).sort(
        (a, b) => computeFreshnessMinutes(a.startTime) - computeFreshnessMinutes(b.startTime)
      ),
      failures,
      getSample: getSampleTransitAlerts,
      unconfiguredMessage: "Sample data. Set BAY_511_API_KEY for live 511 transit alerts."
    });
  }
}
