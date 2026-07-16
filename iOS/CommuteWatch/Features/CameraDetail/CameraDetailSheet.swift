import SwiftUI

struct CameraDetailSheet: View {
    let camera: CameraFeed

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                headerCard

                ZStack(alignment: .topLeading) {
                    CameraPreviewImage(thumbnailURL: camera.thumbnailURL)
                        .frame(height: 260)
                        .clipped()

                    statusBadge
                        .padding(16)
                }
                .background(cardFill, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(cardStroke(cornerRadius: 20))

                infoCard(
                    title: "Location",
                    text: camera.locationHint ?? camera.title
                )

                if let updatedAt = camera.updatedAt {
                    infoCard(
                        title: "Last refresh",
                        text: AppFormatters.formatTimestamp(updatedAt)
                    )
                }

                if let urlString = camera.publicPageURL ?? camera.streamURL, let url = URL(string: urlString) {
                    Link(destination: url) {
                        HStack {
                            Label("Open feed", systemImage: "play.rectangle.fill")
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
        .background(Color(uiColor: .systemGroupedBackground).ignoresSafeArea())
        .presentationDragIndicator(.visible)
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(camera.source)
                .font(.caption2.monospaced().weight(.medium))
                .foregroundStyle(Color.cwTextSecondary)
                .textCase(.uppercase)

            Text(camera.title)
                .font(.title2.weight(.bold))
                .foregroundStyle(Color.cwTextPrimary)

            Text(camera.locationHint ?? camera.title)
                .font(.subheadline)
                .foregroundStyle(Color.cwTextSecondary)
        }
        .padding(20)
        .background(cardFill, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(cardStroke(cornerRadius: 22))
    }

    private func infoCard(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption2.monospaced().weight(.medium))
                .foregroundStyle(Color.cwTextSecondary)
                .textCase(.uppercase)

            Text(text)
                .font(.body.weight(.medium))
                .foregroundStyle(Color.cwTextPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(cardFill, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(cardStroke(cornerRadius: 16))
    }

    private var statusBadge: some View {
        Text(camera.status.rawValue.capitalized)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(camera.status == .available ? Color(hex: 0x1B5E45) : Color(hex: 0x8A5A18))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                camera.status == .available ? Color(hex: 0xE2F1EA) : Color(hex: 0xF5ECD8),
                in: Capsule()
            )
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
    CameraDetailSheet(camera: SampleDataCatalog.cameras.first!)
}
