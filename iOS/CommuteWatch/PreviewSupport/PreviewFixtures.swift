import Foundation

enum PreviewFixtures {
    static let snapshot = SnapshotAssembler.assemble(
        transitAlerts: SampleDataCatalog.transitAlerts,
        trafficIncidents: SampleDataCatalog.trafficIncidents,
        cameras: SampleDataCatalog.cameras,
        sourceStatus: [
            .transit: SourceStatus(
                key: .transit,
                label: "Transit",
                ok: true,
                mode: .fallback,
                itemCount: SampleDataCatalog.transitAlerts.count,
                updatedAt: ISO8601DateFormatter().string(from: .now),
                endpoint: nil,
                message: "Preview transit sample"
            ),
            .traffic: SourceStatus(
                key: .traffic,
                label: "Traffic",
                ok: true,
                mode: .fallback,
                itemCount: SampleDataCatalog.trafficIncidents.count,
                updatedAt: ISO8601DateFormatter().string(from: .now),
                endpoint: nil,
                message: "Preview traffic sample"
            ),
            .cameras: SourceStatus(
                key: .cameras,
                label: "Cameras",
                ok: true,
                mode: .fallback,
                itemCount: SampleDataCatalog.cameras.count,
                updatedAt: ISO8601DateFormatter().string(from: .now),
                endpoint: nil,
                message: "Preview camera sample"
            )
        ],
        commute: SampleDataCatalog.sampleCommute
    )

    @MainActor
    static func homeViewModel() -> HomeViewModel {
        HomeViewModel(
            repository: MockIncidentRepository(snapshot: snapshot),
            geocodingService: SampleGeocodingService(),
            commuteRouteService: SampleCommuteRouteService(),
            initialSnapshot: snapshot,
            commute: SampleDataCatalog.sampleCommute
        )
    }
}
