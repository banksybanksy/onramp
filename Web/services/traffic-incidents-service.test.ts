import { describe, expect, it } from "vitest";

import { extractTrafficItems, normalizeTrafficItem } from "@/services/traffic-incidents-service";

const open511Payload = {
  events: [
    {
      id: "511.org/1234",
      headline: "INCIDENT",
      description: "Collision, two right lanes blocked on I-80 WB at Treasure Island.",
      event_subtype: "Collision",
      created: "2026-10-12T16:58:00Z",
      geography: { type: "Point", coordinates: [-122.3694, 37.8224] },
      roads: [{ name: "I-80", from: "Treasure Island", to: "Fremont St", direction: "Westbound" }]
    },
    {
      id: "511.org/5678",
      headline: "CONSTRUCTION",
      description: "Lane closure on SR-24.",
      geography: {
        type: "LineString",
        coordinates: [
          [-122.18, 37.86],
          [-122.17, 37.87]
        ]
      }
    }
  ]
};

const geoJsonPayload = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-122.401, 37.615] },
      properties: { id: "f-1", title: "Stall on US-101 near SFO", severity: 1 }
    },
    { type: "Feature", geometry: null }
  ]
};

describe("extractTrafficItems", () => {
  it("reads Open511 events, GeoJSON features, and arrays", () => {
    expect(extractTrafficItems(open511Payload)).toHaveLength(2);
    expect(extractTrafficItems(geoJsonPayload)).toHaveLength(1);
    expect(extractTrafficItems([{ id: "a" }, 42])).toHaveLength(1);
    expect(extractTrafficItems(undefined)).toEqual([]);
  });
});

describe("normalizeTrafficItem", () => {
  it("maps an Open511 event", () => {
    const [event] = extractTrafficItems(open511Payload);
    expect(normalizeTrafficItem(event)).toMatchObject({
      id: "511.org/1234",
      title: "INCIDENT",
      subtitle: "Collision",
      severity: "major",
      coordinate: { lat: 37.8224, lng: -122.3694 },
      startTime: "2026-10-12T16:58:00Z",
      roadNames: ["I-80"],
      agency: "Other"
    });
  });

  it("uses the first vertex of a line geometry", () => {
    const [, event] = extractTrafficItems(open511Payload);
    expect(normalizeTrafficItem(event).coordinate).toEqual({ lat: 37.86, lng: -122.18 });
  });

  it("reads GeoJSON coordinates and numeric severities", () => {
    const [feature] = extractTrafficItems(geoJsonPayload);
    expect(normalizeTrafficItem(feature)).toMatchObject({
      id: "f-1",
      severity: "minor",
      coordinate: { lat: 37.615, lng: -122.401 }
    });
  });

  it("places an event without usable geometry from its text, never at NaN", () => {
    const incident = normalizeTrafficItem({
      title: "Slow traffic on I-880 in Oakland",
      location: { lat: "unknown" }
    });
    expect(incident.coordinate).toEqual({ lat: 37.8044, lng: -122.2712 });
  });
});
