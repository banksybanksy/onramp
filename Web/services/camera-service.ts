import { logger } from "@/lib/logger";
import { getSampleCameras } from "@/lib/sample-data";
import {
  flattenGeoJsonFeatures,
  getArrayOfRecords,
  getRecord,
  isFiniteCoordinate,
  type UnknownRecord
} from "@/lib/records";
import { pickFirstString, uniqueBy } from "@/lib/utils";
import { resolveCoordinateFromText } from "@/lib/geo";
import { SERVER_CONFIG } from "@/lib/config";
import { fetchJson } from "@/services/fetch-json";
import { describeFailure, resolveSource } from "@/services/source-status";
import type { CameraFeed, ServiceResult } from "@/types";

/** Accepts a bare array, `{ cameras }`, GeoJSON features, or Caltrans `{ data: [{ cctv }] }`. */
export function extractCameraItems(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return getArrayOfRecords(payload);
  }

  const record = getRecord(payload);
  if (Array.isArray(record?.cameras)) {
    return getArrayOfRecords(record.cameras);
  }

  if (Array.isArray(record?.features)) {
    return flattenGeoJsonFeatures(record.features);
  }

  return getArrayOfRecords(record?.data)
    .map((item) => getRecord(item.cctv))
    .filter((item): item is UnknownRecord => item !== null);
}

/**
 * Produces a human-readable location hint from a raw Caltrans CCTV location name.
 * Strips the "TV001--" index prefix and formats "Roadway : Cross Street" as
 * "Roadway near Cross Street".
 */
export function deriveCameraLocationHint(title: string) {
  const withoutPrefix = title
    .replace(/^TV\d+\s*--\s*/i, "")
    .replace(/\s+camera$/i, "")
    .trim();

  if (withoutPrefix.includes(" : ")) {
    const [roadway, crossStreet] = withoutPrefix.split(/\s:\s/, 2);
    return `${roadway} near ${crossStreet}`;
  }

  return withoutPrefix;
}

export function normalizeCameraItem(item: UnknownRecord) {
  const location = getRecord(item.location);
  const imageData = getRecord(item.imageData);
  const staticImages = getRecord(imageData?.static);
  const recordTimestamp = getRecord(item.recordTimestamp);

  const rawTitle = pickFirstString(
    item.title,
    item.name,
    location?.locationName,
    item.description,
    "Camera"
  );
  const title = deriveCameraLocationHint(rawTitle);

  const explicit = getRecord(item.coordinate);
  const coordinate = explicit
    ? { lat: Number(explicit.lat), lng: Number(explicit.lng) }
    : location
      ? { lat: Number(location.latitude), lng: Number(location.longitude) }
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

  // Caltrans rarely sends a page URL and its RTSP streams don't play in a
  // browser, so link to QuickMap, the official Caltrans camera map.
  const publicPageUrl =
    pickFirstString(item.publicPageUrl, item.url, item.pageUrl) || "https://quickmap.dot.ca.gov/";

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
    const feeds = SERVER_CONFIG.cameraFeeds;
    const failures: string[] = [];

    const settled = await Promise.allSettled(
      feeds.map(async (feed) => {
        const payload = await fetchJson<unknown>(feed.url);
        return extractCameraItems(payload).map(normalizeCameraItem);
      })
    );

    const cameras = settled.flatMap((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      logger.warn("CameraService", "Camera feed failed", result.reason);
      failures.push(`Camera feed failed: ${describeFailure(result.reason)}.`);
      return [];
    });

    return resolveSource({
      key: "cameras",
      endpoints: feeds.map((feed) => feed.url),
      // A camera without a real position cannot be matched to an incident.
      liveItems: uniqueBy(cameras, (camera) => camera.id).filter((camera) =>
        isFiniteCoordinate(camera.coordinate)
      ),
      failures,
      getSample: getSampleCameras,
      unconfiguredMessage: "Sample camera metadata. Set CAMERA_FEED_URLS for live cameras."
    });
  }
}
