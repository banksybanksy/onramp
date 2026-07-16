import Foundation
import MapKit

struct APIServiceEnvelope<Value: Decodable>: Decodable {
    let data: Value
    let sourceStatus: SourceStatus
    let warnings: [String]
}

protocol GeocodingServicing {
    func search(query: String) async throws -> [GeocodeCandidate]
}

protocol CommuteRouteServicing {
    func fetchRoute(origin: Coordinate, destination: Coordinate) async throws -> CommuteRouteResponse
}

struct RemoteTransitAlertsService: TransitAlertsProviding {
    let apiClient: APIClient
    let endpoint: URL

    func fetchTransitAlerts() async throws -> ServiceResult<[TransitAlert]> {
        let payload = try await apiClient.fetch(endpoint, as: APIServiceEnvelope<[TransitAlert]>.self)
        return ServiceResult(data: payload.data, sourceStatus: payload.sourceStatus, warnings: payload.warnings)
    }
}

struct RemoteTrafficIncidentsService: TrafficIncidentsProviding {
    let apiClient: APIClient
    let endpoint: URL

    func fetchTrafficIncidents() async throws -> ServiceResult<[TrafficIncident]> {
        let payload = try await apiClient.fetch(endpoint, as: APIServiceEnvelope<[TrafficIncident]>.self)
        return ServiceResult(data: payload.data, sourceStatus: payload.sourceStatus, warnings: payload.warnings)
    }
}

struct RemoteCameraServiceEnvelopeClient: CameraServicing {
    let apiClient: APIClient
    let endpoint: URL

    func fetchCameras() async throws -> ServiceResult<[CameraFeed]> {
        let payload = try await apiClient.fetch(endpoint, as: APIServiceEnvelope<[CameraFeed]>.self)
        return ServiceResult(data: payload.data, sourceStatus: payload.sourceStatus, warnings: payload.warnings)
    }
}

struct RemoteGeocodingService: GeocodingServicing {
    let apiClient: APIClient
    let endpoint: URL

    private struct Response: Decodable {
        let results: [GeocodeCandidate]
    }

    func search(query: String) async throws -> [GeocodeCandidate] {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return []
        }

        var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [URLQueryItem(name: "q", value: query)]

        guard let url = components?.url else {
            return []
        }

        let payload = try await apiClient.fetch(url, as: Response.self)
        return payload.results
    }
}

struct SampleGeocodingService: GeocodingServicing {
    func search(query: String) async throws -> [GeocodeCandidate] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !trimmed.isEmpty else { return [] }

        return [
            GeocodeCandidate(
                id: "downtown-oakland",
                label: "Downtown Oakland",
                coordinate: Coordinate(lat: 37.8044, lng: -122.2712),
                context: "Oakland, CA"
            ),
            GeocodeCandidate(
                id: "salesforce-transit-center",
                label: "Salesforce Transit Center",
                coordinate: Coordinate(lat: 37.7896, lng: -122.3961),
                context: "San Francisco, CA"
            ),
            GeocodeCandidate(
                id: "millbrae-station",
                label: "Millbrae Station",
                coordinate: Coordinate(lat: 37.6001, lng: -122.3868),
                context: "Millbrae, CA"
            ),
            GeocodeCandidate(
                id: "diridon-station",
                label: "Diridon Station",
                coordinate: Coordinate(lat: 37.3297, lng: -121.9026),
                context: "San Jose, CA"
            )
        ].filter { candidate in
            "\(candidate.label) \(candidate.context ?? "")".lowercased().contains(trimmed)
        }
    }
}

struct RemoteCommuteRouteService: CommuteRouteServicing {
    let apiClient: APIClient
    let endpoint: URL

    private struct RequestBody: Encodable {
        let origin: Coordinate
        let destination: Coordinate
    }

    func fetchRoute(origin: Coordinate, destination: Coordinate) async throws -> CommuteRouteResponse {
        try await apiClient.send(
            endpoint,
            method: "POST",
            body: RequestBody(origin: origin, destination: destination),
            as: CommuteRouteResponse.self
        )
    }
}

enum AppleMapsRouteError: LocalizedError {
    case routeUnavailable

    var errorDescription: String? {
        switch self {
        case .routeUnavailable:
            return "Apple Maps could not build a route right now."
        }
    }
}

struct AppleMapsCommuteRouteService: CommuteRouteServicing {
    func fetchRoute(origin: Coordinate, destination: Coordinate) async throws -> CommuteRouteResponse {
        let request = MKDirections.Request()
        request.source = MKMapItem(placemark: MKPlacemark(coordinate: origin.clLocationCoordinate2D))
        request.destination = MKMapItem(placemark: MKPlacemark(coordinate: destination.clLocationCoordinate2D))
        request.transportType = .automobile
        request.requestsAlternateRoutes = false

        let response = try await MKDirections(request: request).calculate()
        guard let route = response.routes.first else {
            throw AppleMapsRouteError.routeUnavailable
        }

        var coordinates = Array(
            repeating: CLLocationCoordinate2D(latitude: 0, longitude: 0),
            count: route.polyline.pointCount
        )
        route.polyline.getCoordinates(&coordinates, range: NSRange(location: 0, length: route.polyline.pointCount))

        return CommuteRouteResponse(
            geometry: coordinates.map { Coordinate(lat: $0.latitude, lng: $0.longitude) },
            mode: .live,
            distanceKm: route.distance / 1_000
        )
    }
}

struct SampleCommuteRouteService: CommuteRouteServicing {
    func fetchRoute(origin: Coordinate, destination: Coordinate) async throws -> CommuteRouteResponse {
        CommuteRouteResponse(
            geometry: SampleDataCatalog.sampleRouteGeometry(origin: origin, destination: destination),
            mode: .fallback,
            distanceKm: GeoUtilities.haversineDistanceKilometers(from: origin, to: destination)
        )
    }
}
