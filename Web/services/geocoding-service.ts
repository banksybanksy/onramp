import { PUBLIC_CONFIG } from "@/lib/config";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/utils";
import { fetchJson } from "@/services/fetch-json";
import type { GeocodeCandidate } from "@/types";

const SAMPLE_GEOCODER_CANDIDATES: GeocodeCandidate[] = [
  {
    id: "downtown-oakland",
    label: "Downtown Oakland",
    context: "Oakland, CA",
    coordinate: { lat: 37.8044, lng: -122.2712 }
  },
  {
    id: "salesforce-transit-center",
    label: "Salesforce Transit Center",
    context: "San Francisco, CA",
    coordinate: { lat: 37.7896, lng: -122.3961 }
  },
  {
    id: "millbrae-station",
    label: "Millbrae Station",
    context: "Millbrae, CA",
    coordinate: { lat: 37.6001, lng: -122.3868 }
  },
  {
    id: "diridon-station",
    label: "Diridon Station",
    context: "San Jose, CA",
    coordinate: { lat: 37.3297, lng: -121.9026 }
  },
  {
    id: "berkeley-downtown",
    label: "Downtown Berkeley Station",
    context: "Berkeley, CA",
    coordinate: { lat: 37.8697, lng: -122.2687 }
  }
];

export class GeocodingService {
  async search(query: string): Promise<GeocodeCandidate[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    if (!PUBLIC_CONFIG.mapboxToken) {
      return SAMPLE_GEOCODER_CANDIDATES.filter((candidate) =>
        `${candidate.label} ${candidate.context}`.toLowerCase().includes(trimmed.toLowerCase())
      );
    }

    const encodedQuery = encodeURIComponent(trimmed);

    try {
      const response = await fetchJson<{
        features?: Array<{
          id: string;
          place_name?: string;
          text?: string;
          center?: [number, number];
          properties?: { address?: string };
        }>;
      }>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=us&bbox=-123.18,37.06,-121.55,38.38&limit=5&access_token=${PUBLIC_CONFIG.mapboxToken}`
      );

      return (response.features ?? [])
        .filter((feature) => Array.isArray(feature.center) && feature.center.length === 2)
        .map((feature) => ({
          id: feature.id || slugify(feature.place_name || feature.text || trimmed),
          label: feature.text || feature.place_name || trimmed,
          context: feature.place_name,
          coordinate: {
            lng: feature.center![0],
            lat: feature.center![1]
          }
        }));
    } catch (error) {
      logger.warn("GeocodingService", "Falling back to sample geocoder candidates", error);
      return SAMPLE_GEOCODER_CANDIDATES.filter((candidate) =>
        `${candidate.label} ${candidate.context}`.toLowerCase().includes(trimmed.toLowerCase())
      );
    }
  }
}
