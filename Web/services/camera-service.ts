import { logger } from "@/lib/logger";
import { getSampleCameras } from "@/lib/sample-data";
import { pickFirstString, uniqueBy } from "@/lib/utils";
import { resolveCoordinateFromText } from "@/lib/geo";
import { SERVER_CONFIG } from "@/lib/config";
import { fetchJson } from "@/services/fetch-json";
import type { CameraFeed, ServiceResult } from "@/types";

type CameraPayload = Record<string, unknown> | unknown[];

function getRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function extractCameraItems(payload: CameraPayload) {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }

  if ("cameras" in payload && Array.isArray(payload.cameras)) {
    return payload.cameras.filter(
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

  if ("data" in payload && Array.isArray(payload.data)) {
    return payload.data
      .map((item) => getRecord(item)?.cctv)
      .filter((item): item is Record<string, unknown> => Boolean(item));
  }

  return [];
}

/**
 * Produces a human-readable location hint from a raw Caltrans CCTV location name.
 * Strips the "TV001--" index prefix and formats "Roadway : Cross Street" as
 * "Roadway near Cross Street".
 */
function deriveCameraLocationHint(title: string) {
  const withoutPrefix = title.replace(/^TV\d+\s*--\s*/i, "").replace(/\s+camera$/i, "").trim();

  if (withoutPrefix.includes(" : ")) {
    const [roadway, crossStreet] = withoutPrefix.split(/\s:\s/, 2);
    return `${roadway} near ${crossStreet}`;
  }

  return withoutPrefix;
}

function normalizeCameraItem(item: Record<string, unknown>) {
  const location = getRecord(item.location);
  const imageData = getRecord(item.imageData);
  const staticImages = getRecord(imageData?.static);
  const recordTimestamp = getRecord(item.recordTimestamp);

  // Raw title from feed, then clean it to remove Caltrans index prefixes.
  const rawTitle = pickFirstString(
    item.title,
    item.name,
    location?.locationName,
    item.description,
    "Camera"
  );
  const title = deriveCameraLocationHint(rawTitle);

  const coordinate =
    item.coordinate && typeof item.coordinate === "object"
      ? {
          lat: Number((item.coordinate as { lat?: unknown }).lat),
          lng: Number((item.coordinate as { lng?: unknown }).lng)
        }
      : location
        ? {
            lat: Number(location.latitude),
            lng: Number(location.longitude)
          }
        : resolveCoordinateFromText(title);

  const isInService = pickFirstString(item.inService).toLowerCase() !== "false";

  const updatedAt =
    recordTimestamp && recordTimestamp.recordDate && recordTimestamp.recordTime
      ? `${recordTimestamp.recordDate}T${recordTimestamp.recordTime}Z`
      : pickFirstString(item.updatedAt, item.lastUpdated);

  const streamUrl = pickFirstString(item.streamUrl, imageData?.streamingVideoURL);

  const thumbnailUrl = pickFirstString(
    item.thumbnailUrl,
    staticImages?.currentImageURL,
    imageData?.currentImageURL
  );

  // Prefer an explicit page URL. RTSP stream URLs are not browser-accessible so
  // they're excluded. Caltrans cameras rarely carry a page URL in the feed, so
  // fall back to QuickMap — the official Caltrans traffic map where users can
  // locate and view the camera interactively. The thumbnail is already shown as
  // an inline image in the popup so it doesn't need to double as a link target.
  const publicPageUrl =
    pickFirstString(item.publicPageUrl, item.url, item.pageUrl) ||
    "https://quickmap.dot.ca.gov/";

  const locationHint = pickFirstString(
    item.locationHint,
    item.intersection,
    item.crossStreet,
    location?.locationName ? deriveCameraLocationHint(String(location.locationName)) : undefined,
    title
  );

  return {
    id: pickFirstString(item.id, item.cameraId, item.index, item.name, title),
    title,
    locationHint,
    coordinate,
    source: pickFirstString(item.source, "Caltrans CCTV"),
    agency: "Other" as const,
    status: !isInService
      ? "offline"
      : pickFirstString(item.status).toLowerCase() === "limited"
          ? "limited"
          : "available",
    publicPageUrl,
    streamUrl,
    thumbnailUrl,
    updatedAt
  } satisfies CameraFeed;
}

export class CameraService {
  async getCameras(): Promise<ServiceResult<CameraFeed[]>> {
    const sampleCameras = getSampleCameras();

    if (SERVER_CONFIG.cameraFeeds.length === 0) {
      return {
        data: sampleCameras,
        sourceStatus: {
          key: "cameras",
          label: "Cameras",
          ok: true,
          mode: "fallback",
          itemCount: sampleCameras.length,
          updatedAt: new Date().toISOString(),
          message: "Using bundled camera metadata. Configure camera feeds to enable live camera lookup."
        },
        warnings: []
      };
    }

    const warnings: string[] = [];

    const settled = await Promise.allSettled(
      SERVER_CONFIG.cameraFeeds.map(async (feed) => {
        const payload = await fetchJson<CameraPayload>(feed.url);
        return extractCameraItems(payload).map((item) => normalizeCameraItem(item));
      })
    );

    const cameras = uniqueBy(
      settled.flatMap((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }

        warnings.push(
          `Camera feed failed (${SERVER_CONFIG.cameraFeeds[index].url}): ${String(result.reason)}`
        );
        return [];
      }),
      (camera) => camera.id
    );

    if (cameras.length === 0) {
      return {
        data: sampleCameras,
        sourceStatus: {
          key: "cameras",
          label: "Cameras",
          ok: false,
          mode: "fallback",
          itemCount: sampleCameras.length,
          updatedAt: new Date().toISOString(),
          endpoint: SERVER_CONFIG.cameraFeeds.map((feed) => feed.url).join(", "),
          message:
            warnings[0] ??
            "Configured camera feeds returned no usable data. Showing sample camera metadata."
        },
        warnings
      };
    }

    if (warnings.length > 0) {
      logger.warn("CameraService", "One or more camera feeds failed", warnings);
    }

    // Partial mode when some feeds failed but at least one succeeded.
    const isPartial = warnings.length > 0;

    return {
      data: cameras,
      sourceStatus: {
        key: "cameras",
        label: "Cameras",
        ok: true,
        mode: isPartial ? "partial" : "live",
        itemCount: cameras.length,
        updatedAt: new Date().toISOString(),
        endpoint: SERVER_CONFIG.cameraFeeds.map((feed) => feed.url).join(", "),
        message: isPartial
          ? `Live Caltrans CCTV active with partial fallback: ${warnings.join(" | ")}`
          : "Live Caltrans CCTV active"
      },
      warnings
    };
  }
}
