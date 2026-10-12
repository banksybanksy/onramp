import type { Agency, Coordinate, Severity } from "@/types";

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const APP_NAME = "Onramp";

const BAY_511_API_ROOT = "https://api.511.org";
const CALTRANS_CCTV_ROOT = "https://cwwp2.dot.ca.gov/data";

const parseCsv = (value: string | undefined, fallback: string[]) => {
  if (!value?.trim()) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const PUBLIC_CONFIG = {
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
  mapStyle: process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? "mapbox://styles/mapbox/light-v11",
  mapCenter: {
    lng: -122.2712,
    lat: 37.8044
  } satisfies Coordinate,
  mapZoom: 9.35,
  bounds: {
    west: -123.18,
    south: 37.06,
    east: -121.55,
    north: 38.38
  },
  notificationPollMs: parseNumber(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_MS, 60_000),
  cameraAssociationRadiusKm: 3.5,
  /** Half-width of the From/To route filter, in km. */
  corridorKm: 5,
  endpointTimeoutMs: 10_000
};

export const SERVER_CONFIG = {
  bay511ApiKey: process.env.BAY_511_API_KEY ?? "",
  transitFeeds: [
    {
      agency: "Other" as Agency,
      url:
        process.env.TRANSIT_ALERTS_REGIONAL_URL ||
        (process.env.BAY_511_API_KEY
          ? `${BAY_511_API_ROOT}/transit/servicealerts?api_key=${process.env.BAY_511_API_KEY}&agency=${process.env.BAY_511_TRANSIT_AGENCY ?? "RG"}&format=json`
          : undefined),
      format: process.env.TRANSIT_ALERTS_REGIONAL_FORMAT ?? "gtfs-rt-json"
    }
  ].filter((feed) => !!feed.url),
  trafficFeed: {
    url:
      process.env.TRAFFIC_INCIDENTS_FEED_URL ||
      (process.env.BAY_511_API_KEY
        ? `${BAY_511_API_ROOT}/traffic/events?api_key=${process.env.BAY_511_API_KEY}&format=json&status=ACTIVE`
        : undefined),
    format: process.env.TRAFFIC_INCIDENTS_FEED_FORMAT ?? "open511-json"
  },
  cameraFeeds: parseCsv(process.env.CAMERA_FEED_URLS, []).length
    ? parseCsv(process.env.CAMERA_FEED_URLS, []).map((url) => ({
        url,
        format: process.env.CAMERA_FEED_FORMAT ?? "caltrans-cctv-json"
      }))
    : [
        {
          url:
            process.env.CAMERA_FEED_URL ||
            `${CALTRANS_CCTV_ROOT}/d${process.env.CALTRANS_CCTV_DISTRICT ?? "4"}/cctv/cctvStatusD${(
              process.env.CALTRANS_CCTV_DISTRICT ?? "4"
            ).padStart(2, "0")}.json`,
          format: process.env.CAMERA_FEED_FORMAT ?? "caltrans-cctv-json"
        }
      ],
  directionsProfile: process.env.MAPBOX_DIRECTIONS_PROFILE ?? "driving"
};

export const AGENCY_ORDER: Agency[] = ["BART", "Muni", "Caltrain", "AC Transit", "VTA", "SamTrans"];

export const AGENCY_DEFAULT_COORDINATES: Record<Agency, Coordinate> = {
  BART: { lat: 37.7929, lng: -122.3969 },
  Muni: { lat: 37.7793, lng: -122.4193 },
  Caltrain: { lat: 37.7764, lng: -122.3946 },
  "AC Transit": { lat: 37.8048, lng: -122.2728 },
  VTA: { lat: 37.3297, lng: -121.8892 },
  SamTrans: { lat: 37.563, lng: -122.3255 },
  Other: { lat: 37.7749, lng: -122.4194 }
};

export const SEVERITY_STYLES: Record<Severity, { label: string; accent: string; ring: string }> = {
  minor: {
    label: "Minor",
    accent: "bg-sky-100 text-sky-700",
    ring: "ring-sky-300"
  },
  major: {
    label: "Major",
    accent: "bg-amber-100 text-amber-700",
    ring: "ring-amber-300"
  },
  critical: {
    label: "Critical",
    accent: "bg-rose-100 text-rose-700",
    ring: "ring-rose-300"
  }
};
