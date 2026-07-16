import Foundation

struct AppEnvironment {
    let repository: IncidentRepository
    let geocodingService: GeocodingServicing
    let commuteRouteService: CommuteRouteServicing
    let commute: Commute?

    static var `default`: AppEnvironment {
        makeDefault()
    }

    static func makeDefault() -> AppEnvironment {
        let commute = CommuteStore.load() ?? SampleDataCatalog.sampleCommute
        let sampleRepository = SampleIncidentRepository(commute: commute)
        let sampleGeocoder = SampleGeocodingService()
        let sampleCommuteRouteService = SampleCommuteRouteService()
        let apiClient = URLSessionAPIClient()

        guard let incidentsEndpoint = APIConfiguration.incidentsEndpoint else {
            return AppEnvironment(
                repository: sampleRepository,
                geocodingService: sampleGeocoder,
                commuteRouteService: FallbackCommuteRouteService(
                    primary: AppleMapsCommuteRouteService(),
                    fallback: sampleCommuteRouteService
                ),
                commute: commute
            )
        }

        let remoteRepository = APIIncidentRepository(
            apiClient: apiClient,
            endpoint: incidentsEndpoint
        )

        return AppEnvironment(
            repository: FallbackIncidentRepository(
                primary: remoteRepository,
                fallback: sampleRepository
            ),
            geocodingService: fallbackGeocoder(apiClient: apiClient, fallback: sampleGeocoder),
            commuteRouteService: fallbackCommuteRouteService(
                apiClient: apiClient,
                fallback: sampleCommuteRouteService
            ),
            commute: commute
        )
    }

    private static func fallbackGeocoder(
        apiClient: APIClient,
        fallback: GeocodingServicing
    ) -> GeocodingServicing {
        guard let endpoint = APIConfiguration.geocodeEndpoint else {
            return fallback
        }

        return FallbackGeocodingService(
            primary: RemoteGeocodingService(apiClient: apiClient, endpoint: endpoint),
            fallback: fallback
        )
    }

    private static func fallbackCommuteRouteService(
        apiClient: APIClient,
        fallback: CommuteRouteServicing
    ) -> CommuteRouteServicing {
        let appleMapsPreferred = FallbackCommuteRouteService(
            primary: AppleMapsCommuteRouteService(),
            fallback: fallback
        )

        guard let endpoint = APIConfiguration.commuteRouteEndpoint else {
            return appleMapsPreferred
        }

        return FallbackCommuteRouteService(
            primary: appleMapsPreferred,
            fallback: RemoteCommuteRouteService(apiClient: apiClient, endpoint: endpoint)
        )
    }
}

struct FallbackGeocodingService: GeocodingServicing {
    let primary: GeocodingServicing
    let fallback: GeocodingServicing

    func search(query: String) async throws -> [GeocodeCandidate] {
        do {
            return try await primary.search(query: query)
        } catch {
            return try await fallback.search(query: query)
        }
    }
}

struct FallbackCommuteRouteService: CommuteRouteServicing {
    let primary: CommuteRouteServicing
    let fallback: CommuteRouteServicing

    func fetchRoute(origin: Coordinate, destination: Coordinate) async throws -> CommuteRouteResponse {
        do {
            return try await primary.fetchRoute(origin: origin, destination: destination)
        } catch {
            return try await fallback.fetchRoute(origin: origin, destination: destination)
        }
    }
}
