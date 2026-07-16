import { AGENCY_DEFAULT_COORDINATES, SERVER_CONFIG } from "@/lib/config";
import { computeFreshnessMinutes, resolveCoordinateFromText } from "@/lib/geo";
import { logger } from "@/lib/logger";
import { getSampleTransitAlerts } from "@/lib/sample-data";
import { pickFirstString, toArray, uniqueBy } from "@/lib/utils";
import { fetchJson } from "@/services/fetch-json";
import type { Agency, ServiceResult, TransitAlert } from "@/types";

type TransitPayload = Record<string, unknown> | unknown[];

function getActivePeriodField(
  item: Record<string, unknown>,
  field: "start" | "end"
) {
  const activePeriods = item.active_period;
  if (!Array.isArray(activePeriods)) {
    return undefined;
  }

  const first = activePeriods[0];
  if (!first || typeof first !== "object") {
    return undefined;
  }

  return (first as Record<string, unknown>)[field];
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

  if (
    value &&
    typeof value === "object" &&
    "translation" in value &&
    Array.isArray((value as { translation?: unknown[] }).translation)
  ) {
    const first = (value as { translation: Array<{ text?: string }> }).translation[0];
    return first?.text ?? "";
  }

  return "";
}

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

function getInformEntityRecords(item: Record<string, unknown>) {
  return [
    ...getArrayOfRecords(item.informedEntities),
    ...getArrayOfRecords(item.informed_entities),
    ...getArrayOfRecords(item.informedEntity)
  ];
}

function getNestedTimeValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  const record = getRecord(value);
  if (!record) {
    return undefined;
  }

  return pickFirstString(record.low, record.high, record.time);
}

function normalizeTransitEntity(item: Record<string, unknown>, fallbackAgency: Agency) {
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
    item.agency ??
      item.agency_id ??
      item.operator ??
      item.source ??
      title ??
      description,
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
    severity: normalizeSeverity(
      item.severity ?? item.severity_level ?? item.effect ?? item.cause
    ),
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
    url: pickFirstString(
      item.url,
      item.link,
      item.moreInfoUrl,
      getRecord(item.cause_detail)?.url
    ),
    source: pickFirstString(item.source, "511 SF Bay Transit Service Alerts")
  } satisfies TransitAlert;
}

function extractTransitEntities(payload: TransitPayload) {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }

  if ("alerts" in payload && Array.isArray(payload.alerts)) {
    return payload.alerts.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object"
    );
  }

  if ("entity" in payload && Array.isArray(payload.entity)) {
    return payload.entity.flatMap((entity) => {
      if (!entity || typeof entity !== "object" || !("alert" in entity)) {
        return [];
      }

      return [
        {
          ...((entity as { alert?: Record<string, unknown> }).alert ?? {}),
          entity_id: (entity as { id?: unknown }).id
        } satisfies Record<string, unknown>
      ];
    });
  }

  return [];
}

export class TransitAlertsService {
  async getTransitAlerts(): Promise<ServiceResult<TransitAlert[]>> {
    const configuredFeeds = SERVER_CONFIG.transitFeeds.filter((feed) => !!feed.url);

    if (configuredFeeds.length === 0) {
      const sampleAlerts = getSampleTransitAlerts().map((alert) => ({
        ...alert,
        source: alert.source || "Sample Transit Feed"
      }));
      return {
        data: sampleAlerts,
        sourceStatus: {
          key: "transit",
          label: "Transit",
          ok: true,
          mode: "fallback",
          itemCount: sampleAlerts.length,
          updatedAt: new Date().toISOString(),
          message:
            "Using bundled transit sample data. Add BAY_511_API_KEY to enable official 511 SF Bay transit alerts."
        },
        warnings: []
      };
    }

    const warnings: string[] = [];

    const settled = await Promise.allSettled(
      configuredFeeds.map(async (feed) => {
        const payload = await fetchJson<TransitPayload>(feed.url!);
        return extractTransitEntities(payload).map((item) => {
          const record = item as Record<string, unknown>;
          return normalizeTransitEntity(
            {
              ...record,
              source: record.source ?? feed.url
            },
            feed.agency
          );
        });
      })
    );

    const liveAlerts = settled.flatMap((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      const failedFeed = configuredFeeds[index];
      logger.warn(
        "TransitAlertsService",
        `Falling back for ${failedFeed.agency} feed`,
        result.reason
      );
      warnings.push(`${failedFeed.agency} feed failed: ${String(result.reason)}`);
      return [];
    });

    const uniqueAlerts = uniqueBy(liveAlerts, (alert) => alert.id).sort((a, b) => {
      return computeFreshnessMinutes(a.startTime) - computeFreshnessMinutes(b.startTime);
    });

    if (uniqueAlerts.length === 0) {
      const sampleAlerts = getSampleTransitAlerts();
      return {
        data: sampleAlerts,
        sourceStatus: {
          key: "transit",
          label: "Transit",
          ok: false,
          mode: "fallback",
          itemCount: sampleAlerts.length,
          updatedAt: new Date().toISOString(),
          message:
            warnings[0] ??
            "Configured transit feeds did not return usable alert data. Showing sample alerts."
        },
        warnings
      };
    }

    // Partial mode when some feeds failed but at least one returned data.
    const isPartial = warnings.length > 0;

    return {
      data: uniqueAlerts,
      sourceStatus: {
        key: "transit",
        label: "Transit",
        ok: true,
        mode: isPartial ? "partial" : "live",
        itemCount: uniqueAlerts.length,
        updatedAt: new Date().toISOString(),
        endpoint: configuredFeeds.map((feed) => feed.url).join(", "),
        message: isPartial
          ? `Live transit active with degraded feeds: ${warnings.join(" | ")}`
          : "Live transit feeds active"
      },
      warnings
    };
  }
}
