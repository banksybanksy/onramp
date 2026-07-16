import Foundation

private let bayAreaKeywords: [String: Coordinate] = [
    "24th st mission": Coordinate(lat: 37.7525, lng: -122.4187),
    "daly city": Coordinate(lat: 37.6879, lng: -122.4702),
    "salesforce transit center": Coordinate(lat: 37.7896, lng: -122.3961),
    "treasure island": Coordinate(lat: 37.8224, lng: -122.3694),
    "emeryville": Coordinate(lat: 37.8395, lng: -122.2910),
    "sfo": Coordinate(lat: 37.6213, lng: -122.3790),
    "bayshore": Coordinate(lat: 37.7063, lng: -122.4013),
    "oakland": Coordinate(lat: 37.8044, lng: -122.2712),
    "san jose": Coordinate(lat: 37.3382, lng: -121.8863)
]

enum GeoUtilities {
    static func computeFreshnessMinutes(from isoString: String?) -> Int {
        guard let date = AppFormatters.parse(isoString) else {
            return AppConfig.noTimestampSentinel
        }

        return max(0, Int(Date().timeIntervalSince(date) / 60.0))
    }

    static func resolveCoordinate(from text: String, agency: Agency = .other) -> Coordinate {
        let lowercased = text.lowercased()

        for (keyword, coordinate) in bayAreaKeywords where lowercased.contains(keyword) {
            return coordinate
        }

        return AppConfig.agencyDefaultCoordinates[agency] ?? AppConfig.defaultCenter
    }

    static func haversineDistanceKilometers(from start: Coordinate, to end: Coordinate) -> Double {
        let earthRadius = 6_371.0
        let dLat = degreesToRadians(end.lat - start.lat)
        let dLng = degreesToRadians(end.lng - start.lng)
        let lat1 = degreesToRadians(start.lat)
        let lat2 = degreesToRadians(end.lat)

        let h = sin(dLat / 2) * sin(dLat / 2)
            + cos(lat1) * cos(lat2) * sin(dLng / 2) * sin(dLng / 2)

        return 2 * earthRadius * asin(sqrt(h))
    }

    static func buildStraightRoute(
        origin: Coordinate,
        destination: Coordinate,
        segments: Int = 24
    ) -> [Coordinate] {
        (0...segments).map { index in
            let progress = Double(index) / Double(segments)
            return Coordinate(
                lat: origin.lat + ((destination.lat - origin.lat) * progress),
                lng: origin.lng + ((destination.lng - origin.lng) * progress)
            )
        }
    }

    static func findNearestCamera(
        to coordinate: Coordinate,
        cameras: [CameraFeed],
        radiusKilometers: Double = AppConfig.cameraAssociationRadiusKilometers
    ) -> CameraFeed? {
        var bestMatch: (camera: CameraFeed, distance: Double)?

        for camera in cameras {
            let distance = haversineDistanceKilometers(from: coordinate, to: camera.coordinate)
            guard distance <= radiusKilometers else {
                continue
            }

            if let bestMatch, bestMatch.distance <= distance {
                continue
            }

            bestMatch = (camera, distance)
        }

        return bestMatch?.camera
    }

    static func scoreIncident(
        _ incident: Incident,
        against commute: Commute?
    ) -> (affectsMyCommute: Bool, relevanceScore: Int, reasons: [String]) {
        guard let commute else {
            return (false, 0, [])
        }

        let route = commute.routeGeometry?.count ?? 0 > 1
            ? commute.routeGeometry!
            : buildStraightRoute(origin: commute.origin.coordinate, destination: commute.destination.coordinate, segments: 48)

        let originDistance = haversineDistanceKilometers(from: incident.coordinate, to: commute.origin.coordinate)
        let destinationDistance = haversineDistanceKilometers(from: incident.coordinate, to: commute.destination.coordinate)
        let corridorDistance = lineDistanceKilometers(from: incident.coordinate, path: route)

        var score = 0.0
        var reasons: [String] = []

        if corridorDistance <= AppConfig.relevanceCorridorKilometers {
            score += max(18, 28 - corridorDistance * 3.2)
            reasons.append("Within commute corridor")
        }

        if originDistance <= 2.5 {
            score += 10
            reasons.append("Near origin")
        }

        if destinationDistance <= 2.5 {
            score += 10
            reasons.append("Near destination")
        }

        if !commute.preferredAgencies.isEmpty && commute.preferredAgencies.contains(incident.agency) {
            score += 12
            reasons.append("Matches preferred agency")
        }

        score += Double(incident.severity.rank * 5)

        return (score >= 20, Int(round(score)), reasons)
    }

    private static func degreesToRadians(_ value: Double) -> Double {
        value * .pi / 180
    }

    private static func lineDistanceKilometers(from point: Coordinate, path: [Coordinate]) -> Double {
        guard path.count > 1 else {
            return .infinity
        }

        var best = Double.infinity

        for index in 0..<(path.count - 1) {
            best = min(best, pointToSegmentDistanceKilometers(point, path[index], path[index + 1]))
        }

        return best
    }

    private static func pointToSegmentDistanceKilometers(
        _ point: Coordinate,
        _ start: Coordinate,
        _ end: Coordinate
    ) -> Double {
        let reference = start
        let projectedPoint = projectCoordinate(reference: reference, point: point)
        let projectedStart = projectCoordinate(reference: reference, point: start)
        let projectedEnd = projectCoordinate(reference: reference, point: end)

        let segmentX = projectedEnd.x - projectedStart.x
        let segmentY = projectedEnd.y - projectedStart.y
        let segmentLengthSquared = (segmentX * segmentX) + (segmentY * segmentY)

        if segmentLengthSquared == 0 {
            return hypot(projectedPoint.x - projectedStart.x, projectedPoint.y - projectedStart.y)
        }

        let t = max(
            0,
            min(
                1,
                ((projectedPoint.x - projectedStart.x) * segmentX + (projectedPoint.y - projectedStart.y) * segmentY)
                    / segmentLengthSquared
            )
        )

        let projectionX = projectedStart.x + (t * segmentX)
        let projectionY = projectedStart.y + (t * segmentY)

        return hypot(projectedPoint.x - projectionX, projectedPoint.y - projectionY)
    }

    private static func projectCoordinate(reference: Coordinate, point: Coordinate) -> (x: Double, y: Double) {
        let x = (point.lng - reference.lng) * cos(degreesToRadians((point.lat + reference.lat) / 2)) * 111.32
        let y = (point.lat - reference.lat) * 110.57
        return (x, y)
    }
}
