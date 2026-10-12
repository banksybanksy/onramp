import CoreLocation
import Foundation

enum Severity: String, Codable, CaseIterable, Hashable {
    case minor
    case major
    case critical

    var displayTitle: String {
        switch self {
        case .minor:
            return "Minor"
        case .major:
            return "Major"
        case .critical:
            return "Critical"
        }
    }

    var rank: Int {
        switch self {
        case .minor:
            return 1
        case .major:
            return 2
        case .critical:
            return 3
        }
    }
}

enum Agency: String, Codable, CaseIterable, Hashable, Identifiable {
    case bart = "BART"
    case muni = "Muni"
    case caltrain = "Caltrain"
    case acTransit = "AC Transit"
    case vta = "VTA"
    case samTrans = "SamTrans"
    case other = "Other"

    var id: String { rawValue }
}

// CodingKeyRepresentable lets `[SourceKey: SourceStatus]` decode from the web API's
// JSON object (`{ "transit": {...} }`) instead of expecting a key/value array.
enum SourceKey: String, Codable, CaseIterable, Hashable, CodingKeyRepresentable {
    case transit
    case traffic
    case cameras
}

enum SourceStatusMode: String, Codable, Hashable {
    case live
    case partial
    case fallback
}

struct Coordinate: Codable, Hashable {
    let lat: Double
    let lng: Double

    var clLocationCoordinate2D: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

struct SourceStatus: Codable, Hashable, Identifiable {
    let key: SourceKey
    let label: String
    let ok: Bool
    let mode: SourceStatusMode
    let itemCount: Int
    let updatedAt: String
    let endpoint: String?
    let message: String?

    var id: SourceKey { key }
}

struct ServiceResult<Value> {
    let data: Value
    let sourceStatus: SourceStatus
    let warnings: [String]
}
