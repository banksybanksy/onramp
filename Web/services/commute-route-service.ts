import { PUBLIC_CONFIG, SERVER_CONFIG } from "@/lib/config";
import { buildStraightRoute, encodePath, haversineDistanceKm } from "@/lib/geo";
import { logger } from "@/lib/logger";
import { fetchJson } from "@/services/fetch-json";
import type { CommuteRouteResponse, Coordinate } from "@/types";

export class CommuteRouteService {
  async getRoute(origin: Coordinate, destination: Coordinate): Promise<CommuteRouteResponse> {
    if (!PUBLIC_CONFIG.mapboxToken) {
      return {
        geometry: buildStraightRoute(origin, destination),
        mode: "fallback",
        distanceKm: haversineDistanceKm(origin, destination)
      };
    }

    const profile = SERVER_CONFIG.directionsProfile || "driving";
    const coordinates = encodePath([origin, destination]);

    try {
      const response = await fetchJson<{
        routes?: Array<{
          distance?: number;
          geometry?: { coordinates?: [number, number][] };
        }>;
      }>(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?geometries=geojson&overview=full&access_token=${PUBLIC_CONFIG.mapboxToken}`
      );

      const route = response.routes?.[0];
      if (!route?.geometry?.coordinates?.length) {
        throw new Error("Directions response contained no route geometry");
      }

      return {
        geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lng, lat })),
        mode: "live",
        distanceKm: (route.distance ?? 0) / 1000
      };
    } catch (error) {
      logger.warn("CommuteRouteService", "Falling back to straight-line corridor", error);
      return {
        geometry: buildStraightRoute(origin, destination),
        mode: "fallback",
        distanceKm: haversineDistanceKm(origin, destination)
      };
    }
  }
}
