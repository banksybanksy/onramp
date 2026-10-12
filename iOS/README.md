# Onramp for iOS

A SwiftUI and MapKit client for the same `/api/*` contract the web app serves. The Xcode project still uses the app's working title, `CommuteWatch`.

## Run

1. Start the web app (`cd Web && npm run dev`), or skip this to use the bundled sample data.
2. Open `CommuteWatch.xcodeproj` in Xcode, pick the `CommuteWatch` scheme and an iPhone simulator, and run.
3. If Xcode asks for signing, set your own team and bundle identifier.

The API base URL is read in this order: a value saved from the in-app backend settings sheet, the `COMMUTEWATCH_API_BASE_URL` environment variable, then the `CommuteWatchAPIBaseURL` Info.plist key (`http://localhost:3000`). On a physical device, use your Mac's LAN address instead of `localhost`.

## How it maps to the web app

- `Models/` mirrors `Web/types/models.ts`: `Incident`, `TransitAlert`, `TrafficIncident`, `CameraFeed`, `SourceStatus` and `IncidentsResponse` decode the web responses directly.
- `APIIncidentRepository` reads `GET /api/incidents`. `FallbackIncidentRepository` switches to `SampleIncidentRepository` (the JSON in `Resources/SampleData/`, copied from `Web/sample-data/`) when the backend is unreachable.
- Place search uses the backend's `/api/geocode`. Routes use MapKit directions first, then `/api/commute-route`. Both fall back to sample data.
- Source pills use the same `live` / `partial` / `fallback` states as the web.

## Unfinished

- **My location** moves the map to `.userLocation`, but nothing requests location permission yet, so it falls back to the default region.
- First launch shows a built-in sample commute (`SampleDataCatalog.sampleCommute`) instead of an empty route.
- Camera snapshots load with `AsyncImage`: no caching and no retry.
- Map position is not persisted between launches.
- There is no test target, and the project has not been built in CI.
