import Foundation

enum APIConfiguration {
    static let overrideBaseURLStorageKey = "commutewatch.api-base-url-override"
    static let infoPlistBaseURLKey = "CommuteWatchAPIBaseURL"
    static let environmentBaseURLKey = "COMMUTEWATCH_API_BASE_URL"

    static var baseURL: URL? {
        if let overrideValue = UserDefaults.standard.string(forKey: overrideBaseURLStorageKey),
           let url = normalizedURL(from: overrideValue) {
            return url
        }

        if let environmentValue = ProcessInfo.processInfo.environment[environmentBaseURLKey],
           let url = normalizedURL(from: environmentValue) {
            return url
        }

        if let infoValue = Bundle.main.object(forInfoDictionaryKey: infoPlistBaseURLKey) as? String,
           let url = normalizedURL(from: infoValue) {
            return url
        }

#if targetEnvironment(simulator)
        return normalizedURL(from: "http://localhost:3000")
#else
        return nil
#endif
    }

    static var configurationIdentity: String {
        baseURL?.absoluteString ?? "sample"
    }

    static var incidentsEndpoint: URL? {
        endpoint(path: "api/incidents")
    }

    static var camerasEndpoint: URL? {
        endpoint(path: "api/cameras")
    }

    static var trafficIncidentsEndpoint: URL? {
        endpoint(path: "api/traffic-incidents")
    }

    static var transitAlertsEndpoint: URL? {
        endpoint(path: "api/transit-alerts")
    }

    static var geocodeEndpoint: URL? {
        endpoint(path: "api/geocode")
    }

    static var commuteRouteEndpoint: URL? {
        endpoint(path: "api/commute-route")
    }

    private static func endpoint(path: String) -> URL? {
        guard let baseURL else {
            return nil
        }

        return baseURL.appending(path: path)
    }

    private static func normalizedURL(from string: String) -> URL? {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return nil
        }

        return URL(string: trimmed.hasSuffix("/") ? String(trimmed.dropLast()) : trimmed)
    }
}
