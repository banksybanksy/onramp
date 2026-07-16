import Foundation

struct TransitAlert: Codable, Hashable, Identifiable {
    let id: String
    let agency: Agency
    let title: String
    let subtitle: String
    let description: String
    let severity: Severity
    let coordinate: Coordinate
    let affectedRoutes: [String]
    let startTime: String?
    let endTime: String?
    let url: String?
    let source: String
}

struct TrafficIncident: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let description: String
    let severity: Severity
    let coordinate: Coordinate
    let startTime: String?
    let endTime: String?
    let url: String?
    let source: String
    let agency: Agency
    let roadNames: [String]
}

enum CameraFeedStatus: String, Codable, Hashable {
    case available
    case limited
    case offline
}

struct CameraFeed: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    let locationHint: String?
    let coordinate: Coordinate
    let source: String
    let agency: Agency
    let status: CameraFeedStatus
    let publicPageURL: String?
    let streamURL: String?
    let thumbnailURL: String?
    let updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case locationHint
        case coordinate
        case source
        case agency
        case status
        case publicPageURL = "publicPageUrl"
        case streamURL = "streamUrl"
        case thumbnailURL = "thumbnailUrl"
        case updatedAt
    }
}

struct Incident: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let description: String
    let severity: Severity
    let source: String
    let agency: Agency
    let coordinate: Coordinate
    let startTime: String?
    let endTime: String?
    let url: String?
    let affectedRoutes: [String]
    let cameraReference: String?
    let camera: CameraFeed?
    let isTransit: Bool
    let isTraffic: Bool
    let rawSourceType: SourceKey
    let freshnessMinutes: Int
    let relevanceScore: Int
    let affectsMyCommute: Bool
    let commuteReasons: [String]

    var kindLabel: String {
        isTransit ? "Transit" : "Traffic"
    }
}

struct IncidentsResponse: Codable, Hashable {
    let incidents: [Incident]
    let cameras: [CameraFeed]
    let sourceStatus: [SourceKey: SourceStatus]
    let updatedAt: String

    static let empty = IncidentsResponse(
        incidents: [],
        cameras: [],
        sourceStatus: [:],
        updatedAt: ISO8601DateFormatter().string(from: .now)
    )
}
