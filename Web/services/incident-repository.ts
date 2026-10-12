import { findNearestCamera, computeFreshnessMinutes } from "@/lib/geo";
import { uniqueBy } from "@/lib/utils";
import { CameraService } from "@/services/camera-service";
import { TrafficIncidentsService } from "@/services/traffic-incidents-service";
import { TransitAlertsService } from "@/services/transit-alerts-service";
import type { Incident, IncidentsResponse } from "@/types";

export class IncidentRepository {
  private readonly transitAlertsService = new TransitAlertsService();

  private readonly trafficIncidentsService = new TrafficIncidentsService();

  private readonly cameraService = new CameraService();

  async getSnapshot(): Promise<IncidentsResponse> {
    const [transit, traffic, cameras] = await Promise.all([
      this.transitAlertsService.getTransitAlerts(),
      this.trafficIncidentsService.getTrafficIncidents(),
      this.cameraService.getCameras()
    ]);

    const incidents: Incident[] = [
      ...transit.data.map((alert) => {
        const nearestCamera = findNearestCamera(alert.coordinate, cameras.data);
        return {
          id: alert.id,
          title: alert.title,
          subtitle: alert.subtitle,
          description: alert.description,
          severity: alert.severity,
          source: alert.source,
          agency: alert.agency,
          coordinate: alert.coordinate,
          startTime: alert.startTime,
          endTime: alert.endTime,
          url: alert.url,
          affectedRoutes: alert.affectedRoutes,
          cameraReference: nearestCamera?.item.id,
          camera: nearestCamera?.item ?? null,
          isTransit: true,
          isTraffic: false,
          rawSourceType: "transit",
          freshnessMinutes: computeFreshnessMinutes(alert.startTime),
          relevanceScore: 0,
          affectsMyCommute: false,
          commuteReasons: []
        } satisfies Incident;
      }),
      ...traffic.data.map((incident) => {
        const nearestCamera = findNearestCamera(incident.coordinate, cameras.data);
        return {
          id: incident.id,
          title: incident.title,
          subtitle: incident.subtitle,
          description: incident.description,
          severity: incident.severity,
          source: incident.source,
          agency: incident.agency,
          coordinate: incident.coordinate,
          startTime: incident.startTime,
          endTime: incident.endTime,
          url: incident.url,
          affectedRoutes: incident.roadNames,
          cameraReference: nearestCamera?.item.id,
          camera: nearestCamera?.item ?? null,
          isTransit: false,
          isTraffic: true,
          rawSourceType: "traffic",
          freshnessMinutes: computeFreshnessMinutes(incident.startTime),
          relevanceScore: 0,
          affectsMyCommute: false,
          commuteReasons: []
        } satisfies Incident;
      })
    ]
      .sort((a, b) => {
        const severityWeight = { critical: 3, major: 2, minor: 1 };
        if (severityWeight[b.severity] !== severityWeight[a.severity]) {
          return severityWeight[b.severity] - severityWeight[a.severity];
        }
        return a.freshnessMinutes - b.freshnessMinutes;
      })
      .map((incident) => ({
        ...incident,
        freshnessMinutes: Math.round(incident.freshnessMinutes)
      }));

    return {
      incidents: uniqueBy(incidents, (incident) => incident.id),
      cameras: cameras.data,
      sourceStatus: {
        transit: transit.sourceStatus,
        traffic: traffic.sourceStatus,
        cameras: cameras.sourceStatus
      },
      updatedAt: new Date().toISOString()
    };
  }
}
