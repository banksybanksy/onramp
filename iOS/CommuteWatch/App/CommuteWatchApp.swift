import SwiftUI

@main
struct CommuteWatchApp: App {
    @AppStorage(APIConfiguration.overrideBaseURLStorageKey) private var apiBaseURLOverride = ""

    var body: some Scene {
        let environment = AppEnvironment.makeDefault()

        WindowGroup {
            HomeView(
                viewModel: HomeViewModel(
                    repository: environment.repository,
                    geocodingService: environment.geocodingService,
                    commuteRouteService: environment.commuteRouteService,
                    commute: environment.commute
                )
            )
            .id(apiBaseURLOverride.isEmpty ? APIConfiguration.configurationIdentity : apiBaseURLOverride)
        }
    }
}
