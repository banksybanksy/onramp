import MapKit
import SwiftUI

struct HomeMapView: View {
    @Binding var position: MapCameraPosition

    let incidents: [Incident]
    let cameras: [CameraFeed]
    let routeGeometry: [Coordinate]
    let selectedIncidentID: String?
    let selectedCameraID: String?
    let onSelectIncident: (Incident) -> Void
    let onSelectCamera: (CameraFeed) -> Void

    @Namespace private var mapScope

    var body: some View {
        ZStack {
            Map(position: $position, scope: mapScope) {
                if routeGeometry.count > 1 {
                    MapPolyline(coordinates: routeGeometry.map(\.clLocationCoordinate2D))
                        .stroke(Color.cwRoute.opacity(0.8), style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                }

                ForEach(incidents) { incident in
                    Annotation("", coordinate: incident.coordinate.clLocationCoordinate2D, anchor: .center) {
                        Button {
                            onSelectIncident(incident)
                        } label: {
                            MapMarkerBadge(
                                title: incident.isTransit ? (incident.agency == .bart ? "B" : "T") : "!",
                                tint: incident.isTransit ? .cwTransit : .cwTraffic,
                                fill: incident.isTransit ? .white : .cwTrafficSoft,
                                isSelected: incident.id == selectedIncidentID,
                                showsHalo: incident.affectsMyCommute
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                ForEach(cameras) { camera in
                    Annotation("", coordinate: camera.coordinate.clLocationCoordinate2D, anchor: .center) {
                        Button {
                            onSelectCamera(camera)
                        } label: {
                            MapMarkerBadge(
                                title: "C",
                                tint: .cwCamera,
                                fill: .cwCameraSoft,
                                isSelected: camera.id == selectedCameraID,
                                showsHalo: false
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .mapStyle(.standard(elevation: .flat, emphasis: .muted))
            .mapControls {
                MapCompass(scope: mapScope)
            }
            .safeAreaPadding(.leading, 12)
            .safeAreaPadding(.bottom, 208)
            .ignoresSafeArea()
        }
    }
}

private struct MapMarkerBadge: View {
    let title: String
    let tint: Color
    let fill: Color
    let isSelected: Bool
    let showsHalo: Bool

    var body: some View {
        ZStack {
            if isSelected || showsHalo {
                Circle()
                    .fill((isSelected ? tint : tint.opacity(0.55)).opacity(isSelected ? 0.22 : 0.12))
                    .frame(width: isSelected ? 42 : 36, height: isSelected ? 42 : 36)
            }

            Text(title)
                .font(.caption.weight(.bold))
                .foregroundStyle(tint)
                .frame(width: isSelected ? 28 : 24, height: isSelected ? 28 : 24)
                .background(fill, in: Circle())
                .overlay(
                    Circle()
                        .stroke(tint, lineWidth: isSelected ? 3 : 2)
                )
                .shadow(color: Color.black.opacity(0.08), radius: 10, y: 5)
        }
        .compositingGroup()
    }
}
