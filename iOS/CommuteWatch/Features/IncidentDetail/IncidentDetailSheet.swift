import SwiftUI

struct IncidentDetailSheet: View {
    let incident: Incident
    let onOpenCamera: (CameraFeed) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                headerSection

                section("What's happening") {
                    Text(incident.description)
                        .font(.body)
                        .foregroundStyle(Color.cwTextPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(18)
                        .background(cardFill, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(cardStroke(cornerRadius: 18))
                }

                HStack(spacing: 12) {
                    metadataTile(title: "Reported", value: AppFormatters.formatTimestamp(incident.startTime))
                    metadataTile(title: "Agency", value: incident.agency.rawValue)
                }

                if !incident.affectedRoutes.isEmpty {
                    section("Affected routes") {
                        FlowLayout(spacing: 8) {
                            ForEach(incident.affectedRoutes, id: \.self) { route in
                                Text(route)
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(Color.cwTextPrimary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 8)
                                    .background(Color(uiColor: .secondarySystemBackground), in: Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(Color.cwPanelStroke, lineWidth: 1)
                                    )
                            }
                        }
                        .padding(18)
                        .background(cardFill, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(cardStroke(cornerRadius: 18))
                    }
                }

                if let camera = incident.camera, camera.status != .offline {
                    section("Nearby camera") {
                        Button {
                            onOpenCamera(camera)
                        } label: {
                            VStack(alignment: .leading, spacing: 0) {
                                CameraPreviewImage(thumbnailURL: camera.thumbnailURL)
                                    .frame(height: 180)
                                    .clipped()

                                HStack(alignment: .center, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(camera.title)
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(Color.cwTextPrimary)

                                        Text(camera.locationHint ?? camera.title)
                                            .font(.footnote)
                                            .foregroundStyle(Color.cwTextSecondary)
                                    }

                                    Spacer()

                                    cameraSnapshotBadge

                                    Image(systemName: "chevron.right")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(Color.cwTextSecondary)
                                }
                                .padding(16)
                            }
                            .background(cardFill, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            .overlay(cardStroke(cornerRadius: 18))
                        }
                        .buttonStyle(.plain)
                    }
                }

                if let url = incident.url, let link = URL(string: url) {
                    Link(destination: link) {
                        HStack {
                            Text("Open source")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Color.cwTextPrimary)

                            Spacer()

                            Image(systemName: "arrow.up.right")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(Color.cwTextSecondary)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .background(cardFill, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(cardStroke(cornerRadius: 16))
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)
        }
        .scrollIndicators(.hidden)
        .background(sheetBackground)
        .presentationDragIndicator(.visible)
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(incident.source)
                .font(.caption2.monospaced().weight(.medium))
                .foregroundStyle(Color.cwTextSecondary)
                .textCase(.uppercase)

            Text(incident.title)
                .font(.title2.weight(.bold))
                .foregroundStyle(Color.cwTextPrimary)

            Text(incident.subtitle)
                .font(.subheadline)
                .foregroundStyle(Color.cwTextSecondary)

            HStack(spacing: 10) {
                SeverityBadge(severity: incident.severity)

                Text(AppFormatters.formatRelativeMinutes(incident.freshnessMinutes))
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Color.cwTextSecondary)

                if incident.affectsMyCommute {
                    Text("My commute")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.cwTransit)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.cwTransitSoft, in: Capsule())
                }
            }
        }
        .padding(.top, 4)
        .padding(.bottom, 2)
    }

    private var cameraSnapshotBadge: some View {
        Text("Snapshot")
            .font(.caption2.weight(.semibold))
            .foregroundStyle(Color(hex: 0x1B5E45))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(hex: 0xE2F1EA), in: Capsule())
    }

    private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.caption2.monospaced().weight(.medium))
                .foregroundStyle(Color.cwTextSecondary)
                .textCase(.uppercase)

            content()
        }
    }

    private func metadataTile(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption2.monospaced().weight(.medium))
                .foregroundStyle(Color.cwTextSecondary)
                .textCase(.uppercase)

            Text(value)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Color.cwTextPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(cardFill, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(cardStroke(cornerRadius: 16))
    }

    private var sheetBackground: some View {
        Color(uiColor: .systemGroupedBackground)
            .ignoresSafeArea()
    }

    private var cardFill: Color {
        Color(uiColor: .secondarySystemGroupedBackground)
    }

    private func cardStroke(cornerRadius: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .stroke(Color.cwPanelStroke, lineWidth: 1)
    }
}

#Preview {
    IncidentDetailSheet(
        incident: PreviewFixtures.snapshot.incidents.first!,
        onOpenCamera: { _ in }
    )
}
