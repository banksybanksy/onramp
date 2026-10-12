# CommuteWatch iOS

This folder adds the first native iOS foundation for CommuteWatch alongside the existing `Web/` app.

## What was created

- A SwiftUI iOS app target named `CommuteWatch`
- A production-minded folder layout under `iOS/CommuteWatch/`
- Shared native models for `Incident`, `TransitAlert`, `TrafficIncident`, `CameraFeed`, `Agency`, `Severity`, `SourceStatus`, and `Commute`
- Service boundaries for:
  - `APIClient`
  - `IncidentRepository`
  - `CameraServicing`
  - `MockIncidentRepository`
  - sample transit / traffic / camera providers
- A map-first home shell with:
  - top identity card
  - layer and agency filters
  - native MapKit map
  - route overlay foundation
  - incident drawer
  - incident detail sheet
  - camera detail sheet
- Preview support through `PreviewFixtures`
- Mirrored sample JSON under `Resources/SampleData/`

## How this mirrors `Web/`

The native structure follows the current `Web/` implementation rather than inventing a different product model:

- The same main domain nouns are kept: `Incident`, `TransitAlert`, `TrafficIncident`, `CameraFeed`, `Agency`, `Severity`, and `SourceStatus`.
- Incident assembly follows the web repository pattern:
  - transit alerts and traffic incidents stay separate upstream models
  - incidents are merged into a map-facing snapshot
  - nearby cameras are associated by geographic proximity
- Source state still distinguishes `live`, `partial`, and `fallback`.
- The UI keeps the same product direction:
  - Bay Area scope
  - map-first layout
  - restrained utility styling
  - nearby camera context in incident detail
  - clean overlay and sheet flows
- The route overlay foundation comes from the web corridor filter and commute geometry helpers.

## Folder structure

```text
iOS/
  README.md
  CommuteWatch-Info.plist
  CommuteWatch.xcodeproj/
  CommuteWatch/
    App/
    Assets.xcassets/
    Components/
    Features/
    Models/
    Networking/
    PreviewSupport/
    Resources/
    Services/
    Utilities/
```

## Open and run

1. Open [CommuteWatch.xcodeproj](CommuteWatch.xcodeproj) in Xcode.
2. Select the `CommuteWatch` scheme.
3. Pick an iPhone simulator.
4. Build and run.

If Xcode asks for signing, set your own team and bundle identifier in the target settings.

## Backend wiring

The app now starts by preferring the existing web backend endpoint:

- `http://localhost:3000/api/incidents` in Debug
- or `COMMUTEWATCH_API_BASE_URL`
- or the `CommuteWatchAPIBaseURL` Info.plist value

If that backend is unavailable, the app falls back to the bundled sample repository so previews and simulator work are still usable.

The native layer is also wired for the other existing web routes:

- `/api/cameras`
- `/api/traffic-incidents`
- `/api/transit-alerts`
- `/api/geocode`
- `/api/commute-route`

To use the existing local backend:

1. Run the web app from [Web](../Web).
2. Keep the default `CommuteWatchAPIBaseURL` as `http://localhost:3000`, or replace it with your machine IP for physical-device testing.
3. The iOS app will read `/api/incidents` and decode the same `IncidentsResponse` shape used by the web app.

## Recommended next steps

1. Replace `SampleIncidentRepository` with a live repository strategy that points at the existing backend or a native API layer.
2. Add real route filtering/editing to match the web corridor input flow.
3. Add camera snapshot caching and richer media states.
4. Introduce persistence for commute preferences and map state.
5. Add tests around snapshot assembly, filtering, and incident-to-camera association.
