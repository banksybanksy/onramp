// Helpers for reading untyped feed payloads without trusting their shape.

export type UnknownRecord = Record<string, unknown>;

export function getRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

/**
 * Lowercases the first letter of every key, recursively. 511's JSON service
 * alerts use PascalCase (`Entity`, `Alert`, `HeaderText`); after this they read
 * like the camelCase variants the normalizers already handle. snake_case keys
 * are unchanged.
 */
export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys);
  }

  const record = getRecord(value);
  if (!record) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, child]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      camelizeKeys(child)
    ])
  );
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
