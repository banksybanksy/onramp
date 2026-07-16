import Foundation

struct GeocodeCandidate: Codable, Hashable, Identifiable {
    let id: String
    let label: String
    let coordinate: Coordinate
    let context: String?
}

struct CommuteLocation: Codable, Hashable {
    let label: String
    let coordinate: Coordinate
    let context: String?
}

struct Commute: Codable, Hashable {
    let origin: CommuteLocation
    let destination: CommuteLocation
    let preferredAgencies: [Agency]
    let routeGeometry: [Coordinate]?
    let savedAt: String
}

struct CommuteRouteResponse: Codable, Hashable {
    let geometry: [Coordinate]
    let mode: SourceStatusMode
    let distanceKm: Double
}
