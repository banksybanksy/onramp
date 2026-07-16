import Foundation

enum SampleDataCatalog {
    private static let isoFormatter = ISO8601DateFormatter()
    private static let sampleTransbayCorridor: [Coordinate] = [
        Coordinate(lat: 37.8044, lng: -122.2712),
        Coordinate(lat: 37.8062, lng: -122.2768),
        Coordinate(lat: 37.8084, lng: -122.2839),
        Coordinate(lat: 37.8106, lng: -122.2918),
        Coordinate(lat: 37.8128, lng: -122.3002),
        Coordinate(lat: 37.8149, lng: -122.3096),
        Coordinate(lat: 37.8169, lng: -122.3194),
        Coordinate(lat: 37.8187, lng: -122.3308),
        Coordinate(lat: 37.8204, lng: -122.3414),
        Coordinate(lat: 37.8215, lng: -122.3513),
        Coordinate(lat: 37.8218, lng: -122.3598),
        Coordinate(lat: 37.8210, lng: -122.3678),
        Coordinate(lat: 37.8187, lng: -122.3749),
        Coordinate(lat: 37.8144, lng: -122.3811),
        Coordinate(lat: 37.8090, lng: -122.3857),
        Coordinate(lat: 37.8026, lng: -122.3890),
        Coordinate(lat: 37.7967, lng: -122.3910),
        Coordinate(lat: 37.7925, lng: -122.3929),
        Coordinate(lat: 37.7903, lng: -122.3951),
        Coordinate(lat: 37.7896, lng: -122.3961)
    ]

    static var transitAlerts: [TransitAlert] {
        [
            TransitAlert(
                id: "bart-24th-delay",
                agency: .bart,
                title: "10-minute delay through 24th St Mission",
                subtitle: "Signal issue on the Daly City line",
                description: "Residual signal trouble is slowing southbound trains between Powell St and Daly City. Riders should expect platform crowding and a rolling 10-minute delay.",
                severity: .major,
                coordinate: Coordinate(lat: 37.7525, lng: -122.4187),
                affectedRoutes: ["Yellow", "Red"],
                startTime: minutesAgo(20),
                endTime: minutesFromNow(110),
                url: "https://www.bart.gov/schedules/advisories",
                source: "Sample Transit Feed"
            ),
            TransitAlert(
                id: "muni-nline-slow",
                agency: .muni,
                title: "N Judah service slowed in the Sunset",
                subtitle: "Operator availability and street congestion",
                description: "Outbound N Judah trains are bunching west of Van Ness due to operator availability and heavy vehicle congestion near Irving St.",
                severity: .minor,
                coordinate: Coordinate(lat: 37.7621, lng: -122.4662),
                affectedRoutes: ["N"],
                startTime: minutesAgo(35),
                endTime: nil,
                url: "https://www.sfmta.com/travel-updates",
                source: "Sample Transit Feed"
            ),
            TransitAlert(
                id: "caltrain-sf-millbrae",
                agency: .caltrain,
                title: "Major delay between San Francisco and Millbrae",
                subtitle: "Track inspection blocking one platform",
                description: "A track inspection near Bayshore is forcing single-track operation, causing northbound and southbound delays up to 20 minutes.",
                severity: .major,
                coordinate: Coordinate(lat: 37.7099, lng: -122.4013),
                affectedRoutes: ["Local", "Baby Bullet"],
                startTime: minutesAgo(58),
                endTime: nil,
                url: nil,
                source: "Sample Transit Feed"
            ),
            TransitAlert(
                id: "ac-transit-bay-bridge",
                agency: .acTransit,
                title: "Transbay routes rerouted off Fremont St",
                subtitle: "Police activity near the Salesforce Transit Center",
                description: "Routes F, NL, and O are using temporary stops around Mission St while police activity blocks part of Fremont St.",
                severity: .critical,
                coordinate: Coordinate(lat: 37.7891, lng: -122.3959),
                affectedRoutes: ["F", "NL", "O"],
                startTime: minutesAgo(16),
                endTime: nil,
                url: nil,
                source: "Sample Transit Feed"
            ),
            TransitAlert(
                id: "vta-blue-san-jose",
                agency: .vta,
                title: "Blue Line operating every 20 minutes",
                subtitle: "Vehicle availability",
                description: "Blue Line trains are operating on a reduced headway because one vehicle set is out of service for inspection.",
                severity: .minor,
                coordinate: Coordinate(lat: 37.3297, lng: -121.8892),
                affectedRoutes: ["Blue"],
                startTime: minutesAgo(90),
                endTime: nil,
                url: nil,
                source: "Sample Transit Feed"
            ),
            TransitAlert(
                id: "samtrans-101-detour",
                agency: .samTrans,
                title: "Route 398 detour near SFO",
                subtitle: "Northbound stop closure",
                description: "Route 398 is bypassing the usual northbound stop near Terminal 2 because of a lane closure on Airport Access Rd.",
                severity: .minor,
                coordinate: Coordinate(lat: 37.6169, lng: -122.3865),
                affectedRoutes: ["398"],
                startTime: minutesAgo(28),
                endTime: nil,
                url: nil,
                source: "Sample Transit Feed"
            )
        ]
    }

    static var trafficIncidents: [TrafficIncident] {
        [
            TrafficIncident(
                id: "traffic-baybridge-westbound",
                title: "Bay Bridge westbound crash",
                subtitle: "Two right lanes blocked approaching Treasure Island",
                description: "Multi-vehicle collision on I-80 westbound approaching Treasure Island is blocking two right lanes and causing severe backup from Emeryville.",
                severity: .critical,
                coordinate: Coordinate(lat: 37.8198, lng: -122.3491),
                startTime: minutesAgo(18),
                endTime: nil,
                url: "https://quickmap.dot.ca.gov/",
                source: "Sample Traffic Feed",
                agency: .other,
                roadNames: ["I-80", "Bay Bridge"]
            ),
            TrafficIncident(
                id: "traffic-us101-sfo",
                title: "US-101 congestion near SFO",
                subtitle: "Stall blocking shoulder and slow travel lanes",
                description: "Heavy congestion on US-101 northbound near SFO due to an earlier disabled vehicle and persistent airport traffic.",
                severity: .major,
                coordinate: Coordinate(lat: 37.6447, lng: -122.4054),
                startTime: minutesAgo(42),
                endTime: nil,
                url: nil,
                source: "Sample Traffic Feed",
                agency: .other,
                roadNames: ["US-101"]
            ),
            TrafficIncident(
                id: "traffic-880-oakland",
                title: "Slow traffic on I-880 in Oakland",
                subtitle: "Roadwork at 23rd Ave",
                description: "Crews are working on the shoulder near 23rd Ave. Expect stop-and-go traffic on I-880 northbound through East Oakland.",
                severity: .major,
                coordinate: Coordinate(lat: 37.7846, lng: -122.2305),
                startTime: minutesAgo(66),
                endTime: nil,
                url: nil,
                source: "Sample Traffic Feed",
                agency: .other,
                roadNames: ["I-880"]
            ),
            TrafficIncident(
                id: "traffic-280-daly-city",
                title: "Minor slowdown on I-280",
                subtitle: "Emergency response near Daly City",
                description: "Emergency response activity is on the right shoulder of I-280 southbound near Hickey Blvd. Speeds are reduced but traffic is moving.",
                severity: .minor,
                coordinate: Coordinate(lat: 37.6907, lng: -122.4679),
                startTime: minutesAgo(31),
                endTime: nil,
                url: nil,
                source: "Sample Traffic Feed",
                agency: .other,
                roadNames: ["I-280"]
            )
        ]
    }

    static var cameras: [CameraFeed] {
        [
            CameraFeed(
                id: "cam-baybridge-yerba",
                title: "Bay Bridge / Yerba Buena camera",
                locationHint: "Bay Bridge near Yerba Buena Island",
                coordinate: Coordinate(lat: 37.8107, lng: -122.3648),
                source: "Sample Camera Feed",
                agency: .other,
                status: .available,
                publicPageURL: "https://quickmap.dot.ca.gov/",
                streamURL: nil,
                thumbnailURL: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80",
                updatedAt: minutesAgo(8)
            ),
            CameraFeed(
                id: "cam-sfo-101",
                title: "US-101 / SFO approach camera",
                locationHint: "US-101 near SFO",
                coordinate: Coordinate(lat: 37.6401, lng: -122.4049),
                source: "Sample Camera Feed",
                agency: .other,
                status: .available,
                publicPageURL: "https://quickmap.dot.ca.gov/",
                streamURL: nil,
                thumbnailURL: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
                updatedAt: minutesAgo(9)
            ),
            CameraFeed(
                id: "cam-oakland-880",
                title: "I-880 / 23rd Ave camera",
                locationHint: "I-880 near 23rd Ave",
                coordinate: Coordinate(lat: 37.7841, lng: -122.2286),
                source: "Sample Camera Feed",
                agency: .other,
                status: .limited,
                publicPageURL: "https://quickmap.dot.ca.gov/",
                streamURL: nil,
                thumbnailURL: nil,
                updatedAt: minutesAgo(14)
            ),
            CameraFeed(
                id: "cam-transbay-fremont",
                title: "Transit Center / Fremont camera",
                locationHint: "Salesforce Transit Center near Fremont St",
                coordinate: Coordinate(lat: 37.7895, lng: -122.3964),
                source: "Sample Camera Feed",
                agency: .other,
                status: .available,
                publicPageURL: "https://quickmap.dot.ca.gov/",
                streamURL: nil,
                thumbnailURL: nil,
                updatedAt: minutesAgo(6)
            )
        ]
    }

    static var sampleCommute: Commute {
        let origin = CommuteLocation(
            label: "Downtown Oakland",
            coordinate: Coordinate(lat: 37.8044, lng: -122.2712),
            context: "Oakland, CA"
        )
        let destination = CommuteLocation(
            label: "Salesforce Transit Center",
            coordinate: Coordinate(lat: 37.7896, lng: -122.3961),
            context: "San Francisco, CA"
        )

        return Commute(
            origin: origin,
            destination: destination,
            preferredAgencies: [.bart, .acTransit, .muni],
            routeGeometry: sampleRouteGeometry(origin: origin.coordinate, destination: destination.coordinate),
            savedAt: isoFormatter.string(from: .now)
        )
    }

    static func sampleRouteGeometry(origin: Coordinate, destination: Coordinate) -> [Coordinate] {
        if isSampleTransbayRoute(origin: origin, destination: destination) {
            return sampleTransbayCorridor
        }

        return GeoUtilities.buildStraightRoute(origin: origin, destination: destination, segments: 48)
    }

    static func isSampleTransbayRoute(origin: Coordinate, destination: Coordinate) -> Bool {
        let matchesSampleOrigin = GeoUtilities.haversineDistanceKilometers(from: origin, to: Coordinate(lat: 37.8044, lng: -122.2712)) < 2.5
        let matchesSampleDestination = GeoUtilities.haversineDistanceKilometers(from: destination, to: Coordinate(lat: 37.7896, lng: -122.3961)) < 2.5
        return matchesSampleOrigin && matchesSampleDestination
    }

    private static func minutesAgo(_ minutes: Int) -> String {
        isoFormatter.string(from: Date().addingTimeInterval(-Double(minutes) * 60))
    }

    private static func minutesFromNow(_ minutes: Int) -> String {
        isoFormatter.string(from: Date().addingTimeInterval(Double(minutes) * 60))
    }
}
