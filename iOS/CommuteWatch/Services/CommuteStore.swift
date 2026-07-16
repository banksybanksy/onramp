import Foundation

enum CommuteStore {
    private static let commuteKey = "commutewatch.commute"

    static func load() -> Commute? {
        guard let data = UserDefaults.standard.data(forKey: commuteKey) else {
            return nil
        }

        guard let commute = try? JSONDecoder().decode(Commute.self, from: data) else {
            return nil
        }

        if SampleDataCatalog.isSampleTransbayRoute(
            origin: commute.origin.coordinate,
            destination: commute.destination.coordinate
        ) {
            let normalizedGeometry = SampleDataCatalog.sampleRouteGeometry(
                origin: commute.origin.coordinate,
                destination: commute.destination.coordinate
            )

            if normalizedGeometry != commute.routeGeometry, normalizedGeometry.count > 1 {
                return Commute(
                    origin: commute.origin,
                    destination: commute.destination,
                    preferredAgencies: commute.preferredAgencies,
                    routeGeometry: normalizedGeometry,
                    savedAt: commute.savedAt
                )
            }
        }

        return commute
    }

    static func save(_ commute: Commute) {
        guard let data = try? JSONEncoder().encode(commute) else {
            return
        }

        UserDefaults.standard.set(data, forKey: commuteKey)
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: commuteKey)
    }
}
