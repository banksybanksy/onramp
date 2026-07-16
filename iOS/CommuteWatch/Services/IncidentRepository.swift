import Foundation

protocol TransitAlertsProviding {
    func fetchTransitAlerts() async throws -> ServiceResult<[TransitAlert]>
}

protocol TrafficIncidentsProviding {
    func fetchTrafficIncidents() async throws -> ServiceResult<[TrafficIncident]>
}

protocol IncidentRepository {
    func fetchSnapshot() async throws -> IncidentsResponse
}

struct SampleTransitAlertsService: TransitAlertsProviding {
    func fetchTransitAlerts() async throws -> ServiceResult<[TransitAlert]> {
        ServiceResult(
            data: SampleDataCatalog.transitAlerts,
            sourceStatus: SourceStatus(
                key: .transit,
                label: "Transit",
                ok: true,
                mode: .fallback,
                itemCount: SampleDataCatalog.transitAlerts.count,
                updatedAt: ISO8601DateFormatter().string(from: .now),
                endpoint: nil,
                message: "Using bundled transit alerts, matching the web sample-data fallback."
            ),
            warnings: []
        )
    }
}

struct SampleTrafficIncidentsService: TrafficIncidentsProviding {
    func fetchTrafficIncidents() async throws -> ServiceResult<[TrafficIncident]> {
        ServiceResult(
            data: SampleDataCatalog.trafficIncidents,
            sourceStatus: SourceStatus(
                key: .traffic,
                label: "Traffic",
                ok: true,
                mode: .fallback,
                itemCount: SampleDataCatalog.trafficIncidents.count,
                updatedAt: ISO8601DateFormatter().string(from: .now),
                endpoint: nil,
                message: "Using bundled roadway incidents, matching the web sample-data fallback."
            ),
            warnings: []
        )
    }
}

struct SampleIncidentRepository: IncidentRepository {
    let transitService: TransitAlertsProviding
    let trafficService: TrafficIncidentsProviding
    let cameraService: CameraServicing
    let commute: Commute?

    init(
        transitService: TransitAlertsProviding = SampleTransitAlertsService(),
        trafficService: TrafficIncidentsProviding = SampleTrafficIncidentsService(),
        cameraService: CameraServicing = SampleCameraService(),
        commute: Commute? = SampleDataCatalog.sampleCommute
    ) {
        self.transitService = transitService
        self.trafficService = trafficService
        self.cameraService = cameraService
        self.commute = commute
    }

    func fetchSnapshot() async throws -> IncidentsResponse {
        let transit = try await transitService.fetchTransitAlerts()
        let traffic = try await trafficService.fetchTrafficIncidents()
        let cameras = try await cameraService.fetchCameras()

        return SnapshotAssembler.assemble(
            transitAlerts: transit.data,
            trafficIncidents: traffic.data,
            cameras: cameras.data,
            sourceStatus: [
                .transit: transit.sourceStatus,
                .traffic: traffic.sourceStatus,
                .cameras: cameras.sourceStatus
            ],
            commute: commute
        )
    }
}

struct MockIncidentRepository: IncidentRepository {
    let snapshot: IncidentsResponse

    func fetchSnapshot() async throws -> IncidentsResponse {
        snapshot
    }
}

struct APIIncidentRepository: IncidentRepository {
    let apiClient: APIClient
    let endpoint: URL

    func fetchSnapshot() async throws -> IncidentsResponse {
        try await apiClient.fetch(endpoint, as: IncidentsResponse.self)
    }
}

struct FallbackIncidentRepository: IncidentRepository {
    let primary: IncidentRepository
    let fallback: IncidentRepository

    func fetchSnapshot() async throws -> IncidentsResponse {
        do {
            return try await primary.fetchSnapshot()
        } catch {
            return try await fallback.fetchSnapshot()
        }
    }
}

enum SnapshotAssembler {
    static func assemble(
        transitAlerts: [TransitAlert],
        trafficIncidents: [TrafficIncident],
        cameras: [CameraFeed],
        sourceStatus: [SourceKey: SourceStatus],
        commute: Commute?
    ) -> IncidentsResponse {
        let merged = transitAlerts.map { alert in
            makeTransitIncident(from: alert, cameras: cameras, commute: commute)
        } + trafficIncidents.map { incident in
            makeTrafficIncident(from: incident, cameras: cameras, commute: commute)
        }

        let incidents = merged
            .sorted { lhs, rhs in
                if lhs.severity.rank != rhs.severity.rank {
                    return lhs.severity.rank > rhs.severity.rank
                }

                return lhs.freshnessMinutes < rhs.freshnessMinutes
            }

        return IncidentsResponse(
            incidents: incidents,
            cameras: cameras,
            sourceStatus: sourceStatus,
            updatedAt: ISO8601DateFormatter().string(from: .now)
        )
    }

    private static func makeTransitIncident(
        from alert: TransitAlert,
        cameras: [CameraFeed],
        commute: Commute?
    ) -> Incident {
        let linkedCamera = GeoUtilities.findNearestCamera(to: alert.coordinate, cameras: cameras)
        let baseIncident = Incident(
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
            cameraReference: linkedCamera?.id,
            camera: linkedCamera,
            isTransit: true,
            isTraffic: false,
            rawSourceType: .transit,
            freshnessMinutes: GeoUtilities.computeFreshnessMinutes(from: alert.startTime),
            relevanceScore: 0,
            affectsMyCommute: false,
            commuteReasons: []
        )

        return applyCommuteMetadata(to: baseIncident, commute: commute)
    }

    private static func makeTrafficIncident(
        from trafficIncident: TrafficIncident,
        cameras: [CameraFeed],
        commute: Commute?
    ) -> Incident {
        let linkedCamera = GeoUtilities.findNearestCamera(to: trafficIncident.coordinate, cameras: cameras)
        let baseIncident = Incident(
            id: trafficIncident.id,
            title: trafficIncident.title,
            subtitle: trafficIncident.subtitle,
            description: trafficIncident.description,
            severity: trafficIncident.severity,
            source: trafficIncident.source,
            agency: trafficIncident.agency,
            coordinate: trafficIncident.coordinate,
            startTime: trafficIncident.startTime,
            endTime: trafficIncident.endTime,
            url: trafficIncident.url,
            affectedRoutes: trafficIncident.roadNames,
            cameraReference: linkedCamera?.id,
            camera: linkedCamera,
            isTransit: false,
            isTraffic: true,
            rawSourceType: .traffic,
            freshnessMinutes: GeoUtilities.computeFreshnessMinutes(from: trafficIncident.startTime),
            relevanceScore: 0,
            affectsMyCommute: false,
            commuteReasons: []
        )

        return applyCommuteMetadata(to: baseIncident, commute: commute)
    }

    private static func applyCommuteMetadata(to incident: Incident, commute: Commute?) -> Incident {
        let score = GeoUtilities.scoreIncident(incident, against: commute)

        return Incident(
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
            affectedRoutes: incident.affectedRoutes,
            cameraReference: incident.cameraReference,
            camera: incident.camera,
            isTransit: incident.isTransit,
            isTraffic: incident.isTraffic,
            rawSourceType: incident.rawSourceType,
            freshnessMinutes: incident.freshnessMinutes,
            relevanceScore: score.relevanceScore,
            affectsMyCommute: score.affectsMyCommute,
            commuteReasons: score.reasons
        )
    }
}
