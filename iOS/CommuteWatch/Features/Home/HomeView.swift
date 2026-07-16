import SwiftUI

@MainActor
struct HomeView: View {
    @StateObject private var viewModel: HomeViewModel
    @State private var isControlPanelExpanded = false
    @State private var isRouteEditorPresented = false
    @State private var isBackendSettingsPresented = false

    init(viewModel: HomeViewModel? = nil) {
        if let viewModel {
            _viewModel = StateObject(wrappedValue: viewModel)
        } else {
            let environment = AppEnvironment.default
            _viewModel = StateObject(
                wrappedValue: HomeViewModel(
                    repository: environment.repository,
                    geocodingService: environment.geocodingService,
                    commuteRouteService: environment.commuteRouteService,
                    commute: environment.commute
                )
            )
        }
    }

    var body: some View {
        ZStack {
            Color.cwBackground.ignoresSafeArea()

            ambientBackdrop

            HomeMapView(
                position: $viewModel.mapPosition,
                incidents: viewModel.visibleIncidents,
                cameras: viewModel.visibleCameras,
                routeGeometry: viewModel.visibleRouteGeometry,
                selectedIncidentID: viewModel.selectedIncidentID,
                selectedCameraID: viewModel.selectedCameraID,
                onSelectIncident: viewModel.selectIncident,
                onSelectCamera: viewModel.selectCamera
            )

            LinearGradient(
                colors: [
                    Color.white.opacity(0.42),
                    Color.white.opacity(0.04),
                    Color.black.opacity(0.08)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            .allowsHitTesting(false)
        }
        .safeAreaInset(edge: .top) {
            HStack(alignment: .top, spacing: 0) {
                topOverlay
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.top, 8)
        }
        .safeAreaInset(edge: .bottom) {
            IncidentDrawerView(
                incidents: viewModel.visibleIncidents,
                isExpanded: viewModel.isDrawerExpanded,
                selectedIncidentID: viewModel.selectedIncidentID,
                onToggleExpanded: { viewModel.isDrawerExpanded.toggle() },
                onSelectIncident: viewModel.selectIncident
            )
            .padding(.bottom, 8)
        }
        .task {
            await viewModel.loadIfNeeded()
        }
        .sheet(item: $viewModel.activeSheet, onDismiss: viewModel.clearSelection) { destination in
            switch destination {
            case let .incident(incident):
                IncidentDetailSheet(
                    incident: incident,
                    onOpenCamera: viewModel.openCameraFromDetail
                )
                .presentationDetents([.fraction(0.45), .medium, .large])
                .presentationCornerRadius(28)
            case let .camera(camera):
                CameraDetailSheet(camera: camera)
                    .presentationDetents([.fraction(0.42), .medium, .large])
                    .presentationCornerRadius(28)
            }
        }
        .sheet(isPresented: $isRouteEditorPresented) {
            RouteEditorSheet(viewModel: viewModel)
                .presentationDetents([.medium, .large])
                .presentationCornerRadius(28)
        }
        .sheet(isPresented: $isBackendSettingsPresented) {
            BackendSettingsSheet()
                .presentationDetents([.fraction(0.48), .medium])
                .presentationCornerRadius(28)
        }
    }

    private var topOverlay: some View {
        GlassEffectContainer {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .center, spacing: 10) {
                    routeSummaryChip

                    Spacer(minLength: 0)

                    HStack(spacing: 8) {
                        GlassCircleButton(action: viewModel.locateUser) {
                            Image(systemName: "location.fill")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Color.cwTextPrimary)
                        }

                        GlassCircleButton(action: viewModel.recenterMap) {
                            Image(systemName: "arrow.up.left.and.down.right.magnifyingglass")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Color.cwTextPrimary)
                        }

                        GlassCircleButton(action: {
                            withAnimation(.spring(response: 0.32, dampingFraction: 0.86)) {
                                isControlPanelExpanded.toggle()
                            }
                        }) {
                            Group {
                                if viewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle())
                                } else {
                                    Image(systemName: isControlPanelExpanded ? "xmark" : "slider.horizontal.3")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(Color.cwTextPrimary)
                                }
                            }
                        }
                    }
                }

                if isControlPanelExpanded {
                    VStack(alignment: .leading, spacing: 12) {
                        routeTray

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Filters")
                                .font(.caption2.monospaced().weight(.medium))
                                .foregroundStyle(Color.cwTextSecondary)
                                .textCase(.uppercase)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    FilterChip(
                                        title: "Traffic",
                                        isActive: viewModel.filters.traffic,
                                        activeBackground: .cwTraffic,
                                        activeForeground: .cwTraffic
                                    ) {
                                        viewModel.filters.traffic.toggle()
                                    }

                                    FilterChip(
                                        title: "Transit",
                                        isActive: viewModel.filters.transit,
                                        activeBackground: .cwTransit,
                                        activeForeground: .cwTransit
                                    ) {
                                        viewModel.filters.transit.toggle()
                                    }

                                    FilterChip(
                                        title: "Cameras",
                                        isActive: viewModel.filters.cameras,
                                        activeBackground: .cwCamera,
                                        activeForeground: .cwCamera
                                    ) {
                                        viewModel.filters.cameras.toggle()
                                    }
                                }
                            }

                            if viewModel.filters.transit {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 8) {
                                        ForEach(AppConfig.agencyOrder) { agency in
                                            FilterChip(
                                                title: agency.rawValue,
                                                isActive: viewModel.filters.agencies.contains(agency),
                                                activeBackground: .cwTransit,
                                                activeForeground: .cwTransit
                                            ) {
                                                viewModel.toggleAgency(agency)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if let demoCamera = viewModel.demoCamera {
                            Button {
                                viewModel.openCameraDemo()
                            } label: {
                                HStack(spacing: 12) {
                                    ZStack {
                                        Circle()
                                            .fill(Color.cwCameraSoft.opacity(0.9))
                                            .frame(width: 34, height: 34)

                                        Image(systemName: "camera.viewfinder")
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(Color.cwCamera)
                                    }

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Camera demo")
                                            .font(.caption2.monospaced().weight(.medium))
                                            .foregroundStyle(Color.cwTextSecondary)
                                            .textCase(.uppercase)

                                        Text(demoCamera.title)
                                            .font(.footnote.weight(.semibold))
                                            .foregroundStyle(Color.cwTextPrimary)
                                            .lineLimit(1)
                                    }

                                    Spacer(minLength: 0)

                                    Image(systemName: "arrow.up.right")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(Color.cwTextSecondary)
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 11)
                                .background(
                                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                                        .fill(Color.white.opacity(0.18))
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                                        .stroke(Color.white.opacity(0.18), lineWidth: 0.75)
                                )
                            }
                            .buttonStyle(.plain)
                        }

                        Button {
                            isBackendSettingsPresented = true
                        } label: {
                            HStack(spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(Color.white.opacity(0.16))
                                        .frame(width: 34, height: 34)

                                    Image(systemName: "externaldrive.connected.to.line.below")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(Color.cwTextPrimary)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Backend")
                                        .font(.caption2.monospaced().weight(.medium))
                                        .foregroundStyle(Color.cwTextSecondary)
                                        .textCase(.uppercase)

                                    Text(APIConfiguration.baseURL?.host ?? "Sample data")
                                        .font(.footnote.weight(.semibold))
                                        .foregroundStyle(Color.cwTextPrimary)
                                        .lineLimit(1)
                                }

                                Spacer(minLength: 0)

                                Image(systemName: "chevron.right")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(Color.cwTextSecondary)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 11)
                            .background(
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .fill(Color.white.opacity(0.18))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 20, style: .continuous)
                                    .stroke(Color.white.opacity(0.18), lineWidth: 0.75)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(14)
                    .frame(maxWidth: 316, alignment: .leading)
                    .liquidGlassCard(cornerRadius: 26, tint: .cwGlassTint, shadowOpacity: 0.1)
                    .transition(.asymmetric(insertion: .scale(scale: 0.94).combined(with: .opacity), removal: .opacity))
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(viewModel.visibleSourceStatuses) { status in
                            SourceStatusPill(status: status)
                        }

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundStyle(Color(hex: 0x9F1239))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color(hex: 0xFFE4E6), in: Capsule())
                                .modifier(StatusPillGlassModifier(tint: Color(hex: 0x9F1239)))
                        }
                    }
                    .padding(.horizontal, 4)
                }
            }
        }
    }

    private var routeSummaryChip: some View {
        Button {
            isRouteEditorPresented = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "point.topleft.down.curvedto.point.bottomright.up")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.cwTextSecondary)
                    .frame(width: 22, height: 22)
                    .background(Color.white.opacity(0.14), in: Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text("Route")
                        .font(.caption2.monospaced().weight(.medium))
                        .foregroundStyle(Color.cwTextSecondary)
                        .textCase(.uppercase)

                    Text(routeChipTitle)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color.cwTextPrimary)
                        .lineLimit(1)
                }

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .frame(maxWidth: 248, alignment: .leading)
            .background(
                Capsule()
                    .fill(Color.white.opacity(0.18))
            )
            .modifier(StatusPillGlassModifier(tint: Color.cwTextSecondary))
        }
        .buttonStyle(.plain)
    }

    private var routeChipTitle: String {
        guard let commute = viewModel.commute else {
            return "Set route"
        }

        return "\(shortStop(commute.origin.label)) → \(shortStop(commute.destination.label))"
    }

    @ViewBuilder
    private var routeTray: some View {
        if let commute = viewModel.commute {
            VStack(alignment: .leading, spacing: 8) {
                Text("Route")
                    .font(.caption2.monospaced().weight(.medium))
                    .foregroundStyle(Color.cwTextSecondary)
                    .textCase(.uppercase)

                VStack(spacing: 8) {
                    routeStop(
                        title: "From",
                        value: commute.origin.label,
                        symbol: "circle.fill"
                    )
                    routeStop(
                        title: "To",
                        value: commute.destination.label,
                        symbol: "mappin.circle.fill"
                    )
                }
                .padding(10)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Color.white.opacity(0.18))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.white.opacity(0.18), lineWidth: 0.75)
                )
            }
        }
    }

    private func routeStop(title: String, value: String, symbol: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: symbol)
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.cwTextSecondary)
                .frame(width: 18)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Color.cwTextSecondary)
                Text(value)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Color.cwTextPrimary)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)
        }
    }

    private func shortStop(_ label: String) -> String {
        let trimmed = label.replacingOccurrences(of: " Station", with: "")
        if trimmed.count <= 18 {
            return trimmed
        }

        let words = trimmed.split(separator: " ")
        if let first = words.first, let last = words.last, words.count > 1 {
            return "\(first) \(last)"
        }

        return String(trimmed.prefix(18))
    }

    private var ambientBackdrop: some View {
        ZStack {
            Circle()
                .fill(Color.white.opacity(0.28))
                .frame(width: 280, height: 280)
                .blur(radius: 40)
                .offset(x: -120, y: -260)

            Circle()
                .fill(Color.cwGlassTint.opacity(0.26))
                .frame(width: 260, height: 260)
                .blur(radius: 54)
                .offset(x: 160, y: -180)

            Circle()
                .fill(Color.cwTransitSoft.opacity(0.28))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -180, y: 260)
        }
        .allowsHitTesting(false)
    }
}

#Preview {
    HomeView(viewModel: PreviewFixtures.homeViewModel())
}
