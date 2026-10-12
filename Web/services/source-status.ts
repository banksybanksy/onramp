import type { ServiceResult, SourceKey, SourceStatus } from "@/types";

const SOURCE_LABELS: Record<SourceKey, string> = {
  transit: "Transit",
  traffic: "Traffic",
  cameras: "Cameras"
};

interface ResolveSourceOptions<T> {
  key: SourceKey;
  /** Feed URLs that were requested. Empty means no live feed is configured. */
  endpoints: string[];
  /** Normalized items from the feeds that answered. */
  liveItems: T[];
  /** One message per feed that failed. */
  failures: string[];
  /** Bundled sample data, served whenever live data is missing. */
  getSample: () => T[];
  /** Shown when no live feed is configured. */
  unconfiguredMessage: string;
}

// Keep API keys and other query parameters out of the response body; it is
// sent to the browser and embedded in the server-rendered page.
export function redactEndpoint(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

/**
 * Decides what a source serves and how it reports itself. A source that fails
 * or returns nothing usable falls back to sample data and says so (`ok: false`),
 * so an empty map never reads as "no incidents".
 */
export function resolveSource<T>({
  key,
  endpoints,
  liveItems,
  failures,
  getSample,
  unconfiguredMessage
}: ResolveSourceOptions<T>): ServiceResult<T[]> {
  const label = SOURCE_LABELS[key];
  const updatedAt = new Date().toISOString();
  const endpoint = endpoints.length ? endpoints.map(redactEndpoint).join(", ") : undefined;

  const status = (fields: Pick<SourceStatus, "ok" | "mode" | "itemCount" | "message">) =>
    ({ key, label, updatedAt, endpoint, ...fields }) satisfies SourceStatus;

  if (endpoints.length === 0) {
    const sample = getSample();
    return {
      data: sample,
      sourceStatus: status({
        ok: true,
        mode: "fallback",
        itemCount: sample.length,
        message: unconfiguredMessage
      }),
      warnings: []
    };
  }

  if (liveItems.length === 0) {
    const sample = getSample();
    const reason = failures[0] ?? `${label} feed returned no usable records.`;
    return {
      data: sample,
      sourceStatus: status({
        ok: false,
        mode: "fallback",
        itemCount: sample.length,
        message: `${reason} Showing sample data.`
      }),
      warnings: failures.length ? failures : [reason]
    };
  }

  const isPartial = failures.length > 0;
  return {
    data: liveItems,
    sourceStatus: status({
      ok: true,
      mode: isPartial ? "partial" : "live",
      itemCount: liveItems.length,
      message: isPartial
        ? `Some ${label.toLowerCase()} feeds failed: ${failures.join(" | ")}`
        : `Live ${label.toLowerCase()} data.`
    }),
    warnings: failures
  };
}

export function describeFailure(error: unknown) {
  if (error instanceof Error) {
    return error.name === "AbortError" ? "Request timed out" : error.message;
  }

  return String(error);
}
