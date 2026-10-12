import { beforeEach, describe, expect, it, vi } from "vitest";

// Every feed is configured but the network is down: the snapshot must still
// render, flag each source as failed, and never leak the 511 key.
vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    SERVER_CONFIG: {
      ...actual.SERVER_CONFIG,
      transitFeeds: [
        { agency: "Other", url: "https://api.511.org/transit/servicealerts?api_key=SECRET" }
      ],
      trafficFeed: { url: "https://api.511.org/traffic/events?api_key=SECRET" },
      cameraFeeds: [{ url: "https://cwwp2.dot.ca.gov/data/d4/cctv/cctvStatusD04.json" }]
    }
  };
});

const fetchJson = vi.fn();
vi.mock("@/services/fetch-json", () => ({ fetchJson: (url: string) => fetchJson(url) }));

const { IncidentRepository } = await import("@/services/incident-repository");

describe("IncidentRepository.getSnapshot", () => {
  beforeEach(() => {
    fetchJson.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("falls back per source and marks every failed source", async () => {
    fetchJson.mockRejectedValue(new TypeError("fetch failed"));

    const snapshot = await new IncidentRepository().getSnapshot();

    expect(snapshot.incidents.length).toBeGreaterThan(0);
    for (const status of Object.values(snapshot.sourceStatus)) {
      expect(status).toMatchObject({ ok: false, mode: "fallback" });
      expect(status.message).toMatch(/fetch failed\. Showing sample data\.$/);
    }
    expect(JSON.stringify(snapshot)).not.toContain("SECRET");
  });

  it("keeps a live source live when another one fails", async () => {
    fetchJson.mockImplementation(async (url: string) => {
      if (url.includes("traffic")) {
        return {
          events: [{ id: "e1", headline: "Stall on I-280", created: new Date().toISOString() }]
        };
      }
      throw new Error("Request failed with 500");
    });

    const snapshot = await new IncidentRepository().getSnapshot();

    expect(snapshot.sourceStatus.traffic).toMatchObject({ ok: true, mode: "live", itemCount: 1 });
    expect(snapshot.sourceStatus.transit).toMatchObject({ ok: false, mode: "fallback" });
    expect(snapshot.incidents.some((incident) => incident.id === "e1")).toBe(true);
  });
});
