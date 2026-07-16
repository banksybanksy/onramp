import SwiftUI

struct IncidentDrawerView: View {
    let incidents: [Incident]
    let isExpanded: Bool
    let selectedIncidentID: String?
    let onToggleExpanded: () -> Void
    let onSelectIncident: (Incident) -> Void

    var body: some View {
        GlassEffectContainer {
            VStack(alignment: .leading, spacing: 14) {
                Button {
                    withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
                        onToggleExpanded()
                    }
                } label: {
                    HStack(alignment: .center, spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Live incidents")
                                .font(.headline.weight(.semibold))
                                .foregroundStyle(Color.cwTextPrimary)

                            Text("\(incidents.count) matching the current filters")
                                .font(.footnote)
                                .foregroundStyle(Color.cwTextSecondary)
                        }

                        Spacer()

                        Image(systemName: isExpanded ? "chevron.down" : "chevron.up")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.cwTextSecondary)
                            .frame(width: 34, height: 34)
                            .background(Color.white.opacity(0.14), in: Circle())
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if incidents.isEmpty {
                    Text("Nothing matches these filters. Try widening the layers or restoring more agencies.")
                        .font(.footnote)
                        .foregroundStyle(Color.cwTextSecondary)
                        .padding(.vertical, 6)
                } else if isExpanded {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(Array(incidents.prefix(8))) { incident in
                                IncidentCardView(
                                    incident: incident,
                                    isSelected: incident.id == selectedIncidentID
                                ) {
                                    onSelectIncident(incident)
                                }
                            }
                        }
                        .padding(.bottom, 56)
                    }
                    .scrollIndicators(.hidden)
                    .frame(maxHeight: 300)
                    .modifier(IncidentDrawerScrollFadeModifier(showsFade: incidents.count > 2))
                } else if let incident = incidents.first {
                    IncidentCardView(
                        incident: incident,
                        isSelected: incident.id == selectedIncidentID
                    ) {
                        onSelectIncident(incident)
                    }
                }
            }
            .padding(18)
            .liquidGlassCard(cornerRadius: 28, tint: .cwGlassTint, shadowOpacity: 0.09)
            .padding(.horizontal, 14)
        }
    }
}

private struct IncidentDrawerScrollFadeModifier: ViewModifier {
    let showsFade: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if showsFade {
            content
                .mask {
                    VStack(spacing: 0) {
                        Rectangle()
                            .fill(.black)

                        LinearGradient(
                            stops: [
                                .init(color: .black, location: 0),
                                .init(color: .black.opacity(0.86), location: 0.24),
                                .init(color: .black.opacity(0.48), location: 0.62),
                                .init(color: .clear, location: 1)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .frame(height: 84)
                    }
                }
                .overlay(alignment: .bottom) {
                    ProgressiveBlurEdgeFade()
                }
        } else {
            content
        }
    }
}

private struct ProgressiveBlurEdgeFade: View {
    var body: some View {
        Rectangle()
            .fill(.ultraThinMaterial)
            .mask(
                LinearGradient(
                    stops: [
                        .init(color: .clear, location: 0),
                        .init(color: .black.opacity(0.08), location: 0.52),
                        .init(color: .black, location: 1)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .overlay(
                LinearGradient(
                    colors: [
                        Color.clear,
                        Color.white.opacity(0.03),
                        Color.white.opacity(0.07)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .blur(radius: 8)
            .frame(height: 88)
            .allowsHitTesting(false)
    }
}
