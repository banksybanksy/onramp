import MapKit

enum AppConfig {
    static let appName = "CommuteWatch"
    static let freshnessLimitMinutes = 360
    static let noTimestampSentinel = 9_000
    static let cameraAssociationRadiusKilometers = 3.5
    static let relevanceCorridorKilometers = 5.0

    static let agencyOrder: [Agency] = [
        .bart,
        .muni,
        .caltrain,
        .acTransit,
        .vta,
        .samTrans
    ]

    static let defaultCenter = Coordinate(lat: 37.8044, lng: -122.2712)
    static let defaultRegion = MKCoordinateRegion(
        center: defaultCenter.clLocationCoordinate2D,
        span: MKCoordinateSpan(latitudeDelta: 1.28, longitudeDelta: 1.18)
    )

    static let agencyDefaultCoordinates: [Agency: Coordinate] = [
        .bart: Coordinate(lat: 37.7929, lng: -122.3969),
        .muni: Coordinate(lat: 37.7793, lng: -122.4193),
        .caltrain: Coordinate(lat: 37.7764, lng: -122.3946),
        .acTransit: Coordinate(lat: 37.8048, lng: -122.2728),
        .vta: Coordinate(lat: 37.3297, lng: -121.8892),
        .samTrans: Coordinate(lat: 37.5630, lng: -122.3255),
        .other: Coordinate(lat: 37.7749, lng: -122.4194)
    ]
}
