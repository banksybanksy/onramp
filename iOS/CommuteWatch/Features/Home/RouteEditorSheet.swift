import SwiftUI

struct RouteEditorSheet: View {
    @ObservedObject var viewModel: HomeViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var originQuery = ""
    @State private var destinationQuery = ""
    @State private var originResults: [GeocodeCandidate] = []
    @State private var destinationResults: [GeocodeCandidate] = []
    @State private var selectedOrigin: GeocodeCandidate?
    @State private var selectedDestination: GeocodeCandidate?
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("Set a route for live filtering and route-aware context.")
                    .font(.footnote)
                    .foregroundStyle(Color.cwTextSecondary)

                RouteSearchField(
                    title: "From",
                    text: $originQuery,
                    results: originResults,
                    onTextChange: {
                        selectedOrigin = nil
                        runSearch(for: .origin, query: originQuery)
                    },
                    onSelect: { candidate in
                        selectedOrigin = candidate
                        originQuery = candidate.label
                        originResults = []
                    }
                )

                RouteSearchField(
                    title: "To",
                    text: $destinationQuery,
                    results: destinationResults,
                    onTextChange: {
                        selectedDestination = nil
                        runSearch(for: .destination, query: destinationQuery)
                    },
                    onSelect: { candidate in
                        selectedDestination = candidate
                        destinationQuery = candidate.label
                        destinationResults = []
                    }
                )

                Spacer()
            }
            .padding(20)
            .navigationTitle("Route")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if viewModel.commute != nil {
                        Button("Clear") {
                            viewModel.clearRoute()
                            dismiss()
                        }
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        Task {
                            if let origin = selectedOrigin ?? originResults.first,
                               let destination = selectedDestination ?? destinationResults.first {
                                await viewModel.saveRoute(origin: origin, destination: destination)
                                dismiss()
                            }
                        }
                    }
                    .disabled((selectedOrigin ?? originResults.first) == nil || (selectedDestination ?? destinationResults.first) == nil || viewModel.isSavingRoute)
                }
            }
        }
        .onAppear {
            if let commute = viewModel.commute {
                originQuery = commute.origin.label
                destinationQuery = commute.destination.label
                selectedOrigin = GeocodeCandidate(
                    id: "saved-origin",
                    label: commute.origin.label,
                    coordinate: commute.origin.coordinate,
                    context: commute.origin.context
                )
                selectedDestination = GeocodeCandidate(
                    id: "saved-destination",
                    label: commute.destination.label,
                    coordinate: commute.destination.coordinate,
                    context: commute.destination.context
                )
            }
        }
    }

    private func runSearch(for field: Field, query: String) {
        searchTask?.cancel()

        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2 else {
            if field == .origin {
                originResults = []
            } else {
                destinationResults = []
            }
            return
        }

        searchTask = Task {
            let results = await viewModel.searchLocations(query: trimmed)
            guard !Task.isCancelled else { return }

            if field == .origin {
                originResults = results
            } else {
                destinationResults = results
            }
        }
    }

    private enum Field {
        case origin
        case destination
    }
}

private struct RouteSearchField: View {
    let title: String
    @Binding var text: String
    let results: [GeocodeCandidate]
    let onTextChange: () -> Void
    let onSelect: (GeocodeCandidate) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption2.monospaced().weight(.medium))
                .foregroundStyle(Color.cwTextSecondary)
                .textCase(.uppercase)

            TextField(title, text: $text)
                .textFieldStyle(.roundedBorder)
                .onChange(of: text) { _, _ in
                    onTextChange()
                }

            if !results.isEmpty {
                VStack(spacing: 0) {
                    ForEach(results) { result in
                        Button {
                            onSelect(result)
                        } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(result.label)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Color.cwTextPrimary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                if let context = result.context {
                                    Text(context)
                                        .font(.caption)
                                        .foregroundStyle(Color.cwTextSecondary)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)

                        if result.id != results.last?.id {
                            Divider()
                        }
                    }
                }
                .background(Color.cwPanelStrong, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.cwPanelStroke, lineWidth: 1)
                )
            }
        }
    }
}
