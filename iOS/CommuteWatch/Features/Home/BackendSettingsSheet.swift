import SwiftUI

struct BackendSettingsSheet: View {
    @AppStorage(APIConfiguration.overrideBaseURLStorageKey) private var savedBaseURL = ""
    @Environment(\.dismiss) private var dismiss

    @State private var draftBaseURL = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Backend") {
                    TextField("https://your-api.example.com", text: $draftBaseURL)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()

                    Text("Use the server root, for example `https://demo.example.com` or `http://your-mac.local:3000`.")
                        .font(.footnote)
                        .foregroundStyle(Color.cwTextSecondary)
                }

                Section("Current source") {
                    LabeledContent("Resolved base URL") {
                        Text(APIConfiguration.baseURL?.absoluteString ?? "Sample data")
                            .foregroundStyle(Color.cwTextSecondary)
                            .multilineTextAlignment(.trailing)
                    }
                }

                Section("Tips for iPhone") {
                    Text("For a physical device, prefer an HTTPS backend or a reachable `.local` hostname from your Mac instead of `localhost`.")
                        .font(.footnote)
                        .foregroundStyle(Color.cwTextSecondary)
                }
            }
            .navigationTitle("Backend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !savedBaseURL.isEmpty {
                        Button("Clear") {
                            savedBaseURL = ""
                            dismiss()
                        }
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        savedBaseURL = draftBaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            draftBaseURL = savedBaseURL
        }
    }
}

#Preview {
    BackendSettingsSheet()
}
