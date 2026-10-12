import { describe, expect, it } from "vitest";

import { redactEndpoint, resolveSource } from "@/services/source-status";

const sample = [{ id: "sample-1" }, { id: "sample-2" }];
const base = {
  key: "traffic" as const,
  getSample: () => sample,
  unconfiguredMessage: "Sample data. Set BAY_511_API_KEY for live 511 traffic events."
};

describe("resolveSource", () => {
  it("serves sample data, marked ok, when no feed is configured", () => {
    const result = resolveSource({ ...base, endpoints: [], liveItems: [], failures: [] });

    expect(result.data).toBe(sample);
    expect(result.sourceStatus).toMatchObject({
      key: "traffic",
      label: "Traffic",
      ok: true,
      mode: "fallback",
      itemCount: 2,
      message: base.unconfiguredMessage
    });
    expect(result.sourceStatus.endpoint).toBeUndefined();
  });

  it("reports a failed feed as not ok, so sample data never passes for a clear road", () => {
    const result = resolveSource({
      ...base,
      endpoints: ["https://api.511.org/traffic/events?api_key=SECRET"],
      liveItems: [],
      failures: ["Traffic feed failed: Request failed with 503."]
    });

    expect(result.data).toBe(sample);
    expect(result.sourceStatus).toMatchObject({ ok: false, mode: "fallback", itemCount: 2 });
    expect(result.sourceStatus.message).toBe(
      "Traffic feed failed: Request failed with 503. Showing sample data."
    );
    expect(result.warnings).toHaveLength(1);
  });

  it("treats a feed that answered with nothing usable as failed", () => {
    const result = resolveSource({
      ...base,
      endpoints: ["https://example.test/feed"],
      liveItems: [],
      failures: []
    });

    expect(result.sourceStatus.ok).toBe(false);
    expect(result.sourceStatus.message).toBe(
      "Traffic feed returned no usable records. Showing sample data."
    );
  });

  it("is partial when some feeds fail and others return data", () => {
    const live = [{ id: "live-1" }];
    const result = resolveSource({
      ...base,
      key: "cameras",
      endpoints: ["https://a.test/feed", "https://b.test/feed"],
      liveItems: live,
      failures: ["Camera feed failed: Request timed out."]
    });

    expect(result.data).toBe(live);
    expect(result.sourceStatus).toMatchObject({ ok: true, mode: "partial", itemCount: 1 });
  });

  it("is live when every feed answers", () => {
    const result = resolveSource({
      ...base,
      endpoints: ["https://a.test/feed"],
      liveItems: [{ id: "live-1" }],
      failures: []
    });

    expect(result.sourceStatus).toMatchObject({
      ok: true,
      mode: "live",
      message: "Live traffic data."
    });
    expect(result.warnings).toEqual([]);
  });

  it("never exposes API keys in the reported endpoint", () => {
    const result = resolveSource({
      ...base,
      endpoints: ["https://api.511.org/traffic/events?api_key=SECRET&format=json"],
      liveItems: [{ id: "live-1" }],
      failures: []
    });

    expect(result.sourceStatus.endpoint).toBe("https://api.511.org/traffic/events");
    expect(JSON.stringify(result)).not.toContain("SECRET");
  });
});

describe("redactEndpoint", () => {
  it("drops the query string even from strings that are not URLs", () => {
    expect(redactEndpoint("/relative/feed?api_key=SECRET")).toBe("/relative/feed");
  });
});
