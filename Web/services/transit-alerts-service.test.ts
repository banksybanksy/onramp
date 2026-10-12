import { describe, expect, it } from "vitest";

import { AGENCY_DEFAULT_COORDINATES } from "@/lib/config";
import {
  alertsArrayPayload,
  bareArrayPayload,
  bay511JsonPayload,
  gtfsRealtimePayload
} from "@/services/__fixtures__/transit";
import { extractTransitEntities, normalizeTransitEntity } from "@/services/transit-alerts-service";

describe("extractTransitEntities", () => {
  it("unwraps GTFS-Realtime entities and skips ones without an alert", () => {
    const entities = extractTransitEntities(gtfsRealtimePayload);
    expect(entities).toHaveLength(1);
    expect(entities[0].entity_id).toBe("BA:5521");
  });

  it("reads { alerts: [...] } and bare arrays, dropping non-records", () => {
    expect(extractTransitEntities(alertsArrayPayload)).toHaveLength(1);
    expect(extractTransitEntities(bareArrayPayload)).toHaveLength(1);
  });

  it("returns nothing for payloads it does not recognize", () => {
    expect(extractTransitEntities(null)).toEqual([]);
    expect(extractTransitEntities("<html>rate limited</html>")).toEqual([]);
    expect(extractTransitEntities({ unexpected: true })).toEqual([]);
  });
});

describe("normalizeTransitEntity", () => {
  it("maps a GTFS-Realtime alert to the shared model", () => {
    const [entity] = extractTransitEntities(gtfsRealtimePayload);
    const alert = normalizeTransitEntity(entity, "Other");

    expect(alert).toMatchObject({
      id: "BA:5521",
      agency: "BART",
      title: "Delays through 24th St Mission",
      description: "Signal problem near 24th St Mission.",
      severity: "major",
      affectedRoutes: ["YL-S"],
      // POSIX seconds become ISO timestamps.
      startTime: "2025-10-12T13:30:00.000Z",
      endTime: "2025-10-12T17:30:00.000Z",
      source: "511 SF Bay Transit Service Alerts"
    });
    // No coordinate in the feed: placed from the "24th st mission" landmark.
    expect(alert.coordinate).toEqual({ lat: 37.7525, lng: -122.4187 });
  });

  it("handles camelCase field variants and operator codes", () => {
    const [entity] = extractTransitEntities(alertsArrayPayload);
    const alert = normalizeTransitEntity(entity, "Other");

    expect(alert).toMatchObject({
      id: "SF-77",
      agency: "Muni",
      title: "N Judah shuttle buses",
      severity: "critical",
      affectedRoutes: ["N"]
    });
  });

  it("synthesizes a stable id, dedupes routes, and falls back to the agency point", () => {
    const [entity] = extractTransitEntities(bareArrayPayload);
    const first = normalizeTransitEntity(entity, "Other");
    const second = normalizeTransitEntity(entity, "Other");

    expect(first.id).toBe(second.id);
    expect(first.agency).toBe("Caltrain");
    expect(first.affectedRoutes).toEqual(["Local"]);
    expect(first.coordinate).toEqual(AGENCY_DEFAULT_COORDINATES.Caltrain);
    expect(first.startTime).toBe("");
  });

  it("never emits a non-finite coordinate", () => {
    const alert = normalizeTransitEntity(
      { title: "Bad location", agency: "VTA", coordinate: { lat: "north", lng: null } },
      "Other"
    );
    expect(alert.coordinate).toEqual(AGENCY_DEFAULT_COORDINATES.VTA);
  });
});

describe("511 JSON service alerts", () => {
  it("reads the PascalCase shape 511 returns for format=json", () => {
    const entities = extractTransitEntities(bay511JsonPayload);
    expect(entities).toHaveLength(4);

    const alert = normalizeTransitEntity(entities[0], "Other");
    expect(alert).toMatchObject({
      id: "AC_San Pablo Ave. at West Grand Ave. Stop Closed",
      agency: "AC Transit",
      title: "San Pablo at W Grand Stop Closed",
      description: "San Pablo Ave. at West Grand Ave. stop closed.",
      url: "https://www.actransit.org/node/30900",
      startTime: "2025-10-12T13:30:00.000Z"
    });
  });

  it("maps numeric GTFS effects to severity instead of reading them as scores", () => {
    const [stopMoved, lineSuspended, stopClosed, detour] = extractTransitEntities(
      bay511JsonPayload
    ).map((entity) => normalizeTransitEntity(entity, "Other"));
    expect(stopMoved.severity).toBe("minor");
    // NO_SERVICE on a route is critical; on a single stop it is a closed stop.
    expect(lineSuspended).toMatchObject({ agency: "BART", severity: "critical" });
    expect(stopClosed).toMatchObject({ agency: "AC Transit", severity: "major" });
    expect(detour).toMatchObject({ agency: "Muni", severity: "major", affectedRoutes: ["N"] });
  });
});
