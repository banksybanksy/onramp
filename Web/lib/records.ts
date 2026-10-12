// Helpers for reading untyped feed payloads without trusting their shape.

export type UnknownRecord = Record<string, unknown>;

export function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

export function getArrayOfRecords(value: unknown): UnknownRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(getRecord).filter((item): item is UnknownRecord => item !== null);
}

/** Flattens GeoJSON features into their properties plus a `{ lat, lng }` coordinate. */
export function flattenGeoJsonFeatures(features: unknown[]): UnknownRecord[] {
  return getArrayOfRecords(features).flatMap((feature) => {
    const properties = getRecord(feature.properties);
    if (!properties) {
      return [];
    }

    const coordinates = getRecord(feature.geometry)?.coordinates;
    return [
      {
        ...properties,
        coordinate: Array.isArray(coordinates)
          ? { lng: Number(coordinates[0]), lat: Number(coordinates[1]) }
          : undefined
      }
    ];
  });
}

export function isFiniteCoordinate(value: { lat: number; lng: number } | null | undefined) {
  return !!value && Number.isFinite(value.lat) && Number.isFinite(value.lng);
}
