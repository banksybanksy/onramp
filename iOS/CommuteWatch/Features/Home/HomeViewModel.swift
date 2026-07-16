import MapKit
import SwiftUI

struct MapFilterState {
    var transit = true
    var traffic = true
    var cameras = true
    var agencies = Set(AppConfig.agencyOrder)
}

enum HomeSheetDestination: Identifiable {
    case incident(Incident)
    case camera(CameraFeed)

    var id: String {
        switch self {
        case let .incident(incident):
            return "incident-\(incident.id)"
        case let .camera(camera):
            return "camera-\(camera.id)"
        }
    }
}

@MainActor
final class HomeViewModel: ObservableObject {
    @Published private(set) var snapshot: IncidentsResponse
    @Published private(set) var isLoading = false
    @Published private(set) var isSavingRoute = false
    @Published var errorMessage: String?
    @Published var filters = MapFilterState()
    @Published var activeSheet: HomeSheetDestination?
    @Published var selectedIncidentID: String?
    @Published var selectedCameraID: String?
    @Published var mapPosition: MapCameraPosition = .region(AppConfig.defaultRegion)
    @Published var isDrawerExpanded = true
    @Published var commute: Commute?

    private let repository: IncidentRepository
    private let geocodingService: GeocodingServicing
    private let commuteRouteService: CommuteRouteServicing
    private var hasLoaded = false

    init(
        repository: IncidentRepository,
        geocodingService: GeocodingServicing,
        commuteRouteService: CommuteRouteServicing,
        initialSnapshot: IncidentsResponse? = nil,
        commute: Commute? = SampleDataCatalog.sampleCommute
    ) {
        self.repository = repository
        self.geocodingService = geocodingService
        self.commuteRouteService = commuteRouteService
        self.snapshot = initialSnapshot ?? .empty
        self.commute = commute
    }

    var routeSummary: String? {
        guard let commute else {
            return nil
        }

        return "\(commute.origin.label) → \(commute.destination.label)"
    }

    var visibleRouteGeometry: [Coordinate] {
        commute?.routeGeometry ?? []
    }

    var visibleIncidents: [Incident] {
        snapshot.incidents.filter { incident in
            let isFresh = incident.freshnessMinutes >= AppConfig.noTimestampSentinel
                || incident.freshnessMinutes <= AppConfig.freshnessLimitMinutes

            guard isFresh else {
                return false
            }

            guard !Self.isLongTermPlanned(incident) else {
                return false
            }

            if !filters.transit && incident.isTransit {
                return false
            }

            if !filters.traffic && incident.isTraffic {
                return false
            }

            if incident.isTransit && !filters.agencies.isEmpty && !filters.agencies.contains(incident.agency) {
                return false
            }

            return true
        }
        .map(presentationIncident)
    }

    var visibleCameras: [CameraFeed] {
        guard filters.cameras else {
            return []
        }

        return snapshot.cameras.filter { $0.status != .offline }
    }

    var visibleSourceStatuses: [SourceStatus] {
        snapshot.sourceStatus.values
            .filter { $0.mode == .live || $0.mode == .partial || $0.mode == .fallback }
            .sorted { $0.label < $1.label }
    }

    var demoCamera: CameraFeed? {
        visibleCameras.first { $0.status == .available } ?? visibleCameras.first ?? snapshot.cameras.first
    }

    func loadIfNeeded() async {
        guard !hasLoaded else {
            return
        }

        hasLoaded = true
        await refresh()
    }

    func refresh() async {
        isLoading = true

        do {
            snapshot = try await repository.fetchSnapshot()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func toggleAgency(_ agency: Agency) {
        if filters.agencies.contains(agency) {
            filters.agencies.remove(agency)
        } else {
            filters.agencies.insert(agency)
        }
    }

    func selectIncident(_ incident: Incident) {
        selectedIncidentID = incident.id
        selectedCameraID = nil
        activeSheet = .incident(incident)
        focus(on: incident.coordinate)
    }

    func selectCamera(_ camera: CameraFeed) {
        selectedCameraID = camera.id
        selectedIncidentID = nil
        activeSheet = .camera(camera)
        focus(on: camera.coordinate)
    }

    func openCameraFromDetail(_ camera: CameraFeed) {
        activeSheet = .camera(camera)
        selectedCameraID = camera.id
        selectedIncidentID = nil
        focus(on: camera.coordinate)
    }

    func clearSelection() {
        selectedIncidentID = nil
        selectedCameraID = nil
        activeSheet = nil
    }

    func recenterMap() {
        mapPosition = .region(AppConfig.defaultRegion)
    }

    func locateUser() {
        mapPosition = .userLocation(followsHeading: false, fallback: .region(AppConfig.defaultRegion))
    }

    func searchLocations(query: String) async -> [GeocodeCandidate] {
        do {
            return try await geocodingService.search(query: query)
        } catch {
            return []
        }
    }

    func saveRoute(origin: GeocodeCandidate, destination: GeocodeCandidate) async {
        isSavingRoute = true

        do {
            let route = try await commuteRouteService.fetchRoute(
                origin: origin.coordinate,
                destination: destination.coordinate
            )

            let nextCommute = Commute(
                origin: CommuteLocation(
                    label: origin.label,
                    coordinate: origin.coordinate,
                    context: origin.context
                ),
                destination: CommuteLocation(
                    label: destination.label,
                    coordinate: destination.coordinate,
                    context: destination.context
                ),
                preferredAgencies: Array(filters.agencies).sorted { $0.rawValue < $1.rawValue },
                routeGeometry: route.geometry,
                savedAt: ISO8601DateFormatter().string(from: .now)
            )

            commute = nextCommute
            CommuteStore.save(nextCommute)
            focus(onRoute: route.geometry)
            errorMessage = nil
        } catch {
            errorMessage = "Unable to update route right now."
        }

        isSavingRoute = false
    }

    func clearRoute() {
        commute = nil
        CommuteStore.clear()
        recenterMap()
    }

    func openCameraDemo() {
        guard let camera = demoCamera else {
            return
        }

        selectCamera(camera)
    }

    private func presentationIncident(_ incident: Incident) -> Incident {
        guard commute == nil, incident.affectsMyCommute else {
            return incident
        }

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
            relevanceScore: incident.relevanceScore,
            affectsMyCommute: false,
            commuteReasons: []
        )
    }

    private func focus(on coordinate: Coordinate) {
        let region = MKCoordinateRegion(
            center: coordinate.clLocationCoordinate2D,
            span: MKCoordinateSpan(latitudeDelta: 0.18, longitudeDelta: 0.18)
        )
        mapPosition = .region(region)
    }

    private func focus(onRoute geometry: [Coordinate]) {
        guard !geometry.isEmpty else {
            recenterMap()
            return
        }

        let latitudes = geometry.map(\.lat)
        let longitudes = geometry.map(\.lng)

        guard
            let minLat = latitudes.min(),
            let maxLat = latitudes.max(),
            let minLng = longitudes.min(),
            let maxLng = longitudes.max()
        else {
            return
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )

        let latitudeDelta = max((maxLat - minLat) * 1.8, 0.08)
        let longitudeDelta = max((maxLng - minLng) * 1.8, 0.08)

        mapPosition = .region(
            MKCoordinateRegion(
                center: center,
                span: MKCoordinateSpan(latitudeDelta: latitudeDelta, longitudeDelta: longitudeDelta)
            )
        )
    }

    private static func isLongTermPlanned(_ incident: Incident) -> Bool {
        let keywords = [
            "construction project",
            "improvement project",
            "freeway improvement",
            "highway improvement",
            "bridge project",
            "long-term",
            "long term",
            "scheduled maintenance",
            "planned closure",
            "paving project",
            "utility relocation",
            "widening project",
            "roadway project"
        ]

        let haystack = "\(incident.title) \(incident.subtitle)".lowercased()
        return keywords.contains { haystack.contains($0) }
    }
}
