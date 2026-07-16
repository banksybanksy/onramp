import { AGENCY_DEFAULT_COORDINATES, PUBLIC_CONFIG } from "@/lib/config";
import type { Agency, Commute, Coordinate, Incident } from "@/types";

const EARTH_RADIUS_KM = 6371;

export function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a: Coordinate, b: Coordinate) {
  const dLat = degreesToRadians(b.lat - a.lat);
  const dLng = degreesToRadians(b.lng - a.lng);
  const lat1 = degreesToRadians(a.lat);
  const lat2 = degreesToRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function projectCoordinate(reference: Coordinate, point: Coordinate) {
  const x =
    (point.lng - reference.lng) *
    Math.cos(degreesToRadians((point.lat + reference.lat) / 2)) *
    111.32;
  const y = (point.lat - reference.lat) * 110.57;
  return { x, y };
}

export function pointToSegmentDistanceKm(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate
) {
  const reference = start;
  const p = projectCoordinate(reference, point);
  const s = projectCoordinate(reference, start);
  const e = projectCoordinate(reference, end);

  const segmentX = e.x - s.x;
  const segmentY = e.y - s.y;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) {
    return Math.sqrt((p.x - s.x) ** 2 + (p.y - s.y) ** 2);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.x - s.x) * segmentX + (p.y - s.y) * segmentY) / segmentLengthSquared
    )
  );

  const projection = {
    x: s.x + t * segmentX,
    y: s.y + t * segmentY
  };

  return Math.sqrt((p.x - projection.x) ** 2 + (p.y - projection.y) ** 2);
}

export function lineDistanceKm(point: Coordinate, path: Coordinate[]) {
  if (path.length < 2) {
    return Infinity;
  }

  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.length - 1; index += 1) {
    best = Math.min(
      best,
      pointToSegmentDistanceKm(point, path[index], path[index + 1])
    );
  }

  return best;
}

export function computeFreshnessMinutes(dateString?: string) {
  if (!dateString) {
    return 9999;
  }

  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) {
    return 9999;
  }

  return Math.max(0, (Date.now() - timestamp) / 60000);
}

export function severityWeight(severity: Incident["severity"]) {
  switch (severity) {
    case "critical":
      return 3;
    case "major":
      return 2;
    default:
      return 1;
  }
}

export function getAgencyCoordinate(agency: Agency) {
  return AGENCY_DEFAULT_COORDINATES[agency] ?? AGENCY_DEFAULT_COORDINATES.Other;
}

const BAY_AREA_KEYWORDS: Record<string, Coordinate> = {
  "24th st mission": { lat: 37.7525, lng: -122.4187 },
  "daly city": { lat: 37.6879, lng: -122.4702 },
  "salesforce transit center": { lat: 37.7896, lng: -122.3961 },
  "treasure island": { lat: 37.8224, lng: -122.3694 },
  emeryville: { lat: 37.8395, lng: -122.291 },
  "sfo": { lat: 37.6213, lng: -122.379 },
  bayshore: { lat: 37.7063, lng: -122.4013 },
  oakland: { lat: 37.8044, lng: -122.2712 },
  "san jose": { lat: 37.3382, lng: -121.8863 }
};

export function resolveCoordinateFromText(
  text: string,
  agency: Agency = "Other"
) {
  const lowercase = text.toLowerCase();

  for (const [keyword, coordinate] of Object.entries(BAY_AREA_KEYWORDS)) {
    if (lowercase.includes(keyword)) {
      return coordinate;
    }
  }

  return getAgencyCoordinate(agency);
}

export function findNearestCamera<T extends { coordinate: Coordinate }>(
  coordinate: Coordinate,
  cameras: T[],
  radiusKm = PUBLIC_CONFIG.cameraAssociationRadiusKm
) {
  let best: { item: T; distanceKm: number } | null = null;

  for (const camera of cameras) {
    const distanceKm = haversineDistanceKm(coordinate, camera.coordinate);
    if (distanceKm <= radiusKm && (!best || distanceKm < best.distanceKm)) {
      best = { item: camera, distanceKm };
    }
  }

  return best;
}

export function buildStraightRoute(
  origin: Coordinate,
  destination: Coordinate,
  segments = 24
) {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const progress = index / segments;
    return {
      lat: origin.lat + (destination.lat - origin.lat) * progress,
      lng: origin.lng + (destination.lng - origin.lng) * progress
    };
  });
}

export function scoreIncidentForCommute(
  incident: Incident,
  commute: Commute | null | undefined
) {
  if (!commute) {
    return {
      affectsMyCommute: false,
      relevanceScore: 0,
      reasons: [] as string[]
    };
  }

  const routeGeometry =
    commute.routeGeometry && commute.routeGeometry.length > 1
      ? commute.routeGeometry
      : buildStraightRoute(commute.origin.coordinate, commute.destination.coordinate);

  const originDistance = haversineDistanceKm(
    incident.coordinate,
    commute.origin.coordinate
  );
  const destinationDistance = haversineDistanceKm(
    incident.coordinate,
    commute.destination.coordinate
  );
  const corridorDistance = lineDistanceKm(incident.coordinate, routeGeometry);

  let relevanceScore = 0;
  const reasons: string[] = [];

  if (corridorDistance <= PUBLIC_CONFIG.relevanceCorridorKm) {
    relevanceScore += Math.max(18, 28 - corridorDistance * 3.2);
    reasons.push("Within commute corridor");
  }

  if (originDistance <= 2.5) {
    relevanceScore += 10;
    reasons.push("Near origin");
  }

  if (destinationDistance <= 2.5) {
    relevanceScore += 10;
    reasons.push("Near destination");
  }

  if (
    commute.preferredAgencies.length > 0 &&
    commute.preferredAgencies.includes(incident.agency)
  ) {
    relevanceScore += 12;
    reasons.push("Matches preferred agency");
  }

  relevanceScore += severityWeight(incident.severity) * 5;

  const affectsMyCommute = relevanceScore >= 20;

  return {
    affectsMyCommute,
    relevanceScore: Math.round(relevanceScore),
    reasons
  };
}

export function coordinateToPercent(coordinate: Coordinate) {
  const { west, east, south, north } = PUBLIC_CONFIG.bounds;
  const x = ((coordinate.lng - west) / (east - west)) * 100;
  const y = ((north - coordinate.lat) / (north - south)) * 100;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y))
  };
}

export function encodePath(coordinates: Coordinate[]) {
  return coordinates
    .map((coordinate) => `${coordinate.lng},${coordinate.lat}`)
    .join(";");
}
