# Onramp

Onramp puts Bay Area traffic incidents, transit alerts and freeway cameras on one map, so I can check my commute in one place instead of three sites before leaving.

![The web app with live 511 traffic and Caltrans cameras on the map](docs/screenshots/overview.jpg)

<sub>Captured October 12, 2026 with live 511 and Caltrans feeds. Conditions change constantly.</sub>

## How it works

**One contract for three feeds.** The server fetches 511 traffic events (Open511 JSON), 511 transit alerts (GTFS-Realtime as JSON) and Caltrans District 4 CCTV, and normalizes them into a single `IncidentsResponse` from `GET /api/incidents`. Every source also reports a status:

| Status | Meaning |
| --- | --- |
| `live` | Every configured feed for this source answered. |
| `partial` | Some feeds answered, some failed; the message says which. |
| `fallback`, `ok: true` | No key configured. Bundled sample data, labeled "sample". |
| `fallback`, `ok: false` | The feed failed or returned nothing usable. Sample data is shown and the pill turns red ("failed"). |

That last row is the point of the design. A feed that fails must never look like an empty map, because an empty map reads as a clear road. The decision lives in one function, `resolveSource` in [`Web/services/source-status.ts`](Web/services/source-status.ts), and it is unit-tested.

**Normalizing messy feeds.** The 511 transit endpoint returned three payload shapes (`{ entity: [...] }`, `{ alerts: [...] }`, a bare array), mixed `snake_case` and `camelCase` field names, text wrapped in GTFS translation objects, two-letter operator codes and, often, no coordinates. My first parser assumed one shape, and alerts silently vanished. The normalizers in `Web/services/*-service.ts` now accept every shape seen so far, convert GTFS epoch-second timestamps, map operator codes to agencies, and place route-wide alerts at an approximate landmark or agency point instead of dropping them. Fixtures from each shape are in `Web/services/__fixtures__/` and the tests next to the services.

**Two clients, one contract.** The Next.js client (Mapbox GL) and the SwiftUI client in `iOS/` (MapKit) both decode the same `/api/*` responses, so incidents, severities and source status mean the same thing on web and on the phone. The 511 key stays on the server; only the public Mapbox token reaches the browser.

## Run it

Web app (Node 20.19 or newer):

```bash
cd Web
npm install
npm run dev     # http://localhost:3000
```

It runs with no keys at all: every source serves bundled sample data, labeled as sample, and the map area shows a notice instead of tiles. To go live, copy `Web/.env.example` to `Web/.env.local` and fill in:

| Variable | Enables | Without it |
| --- | --- | --- |
| `BAY_511_API_KEY` | Live 511 traffic events and transit alerts ([free key](https://511.org/open-data/token)) | Sample incidents and alerts |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Map tiles and place search; driving routes for the iOS client (public `pk.` token) | No map; place search knows five sample stations; routes are straight lines |

Caltrans cameras need no key. Optional feed overrides are listed in `Web/.env.example`.

Checks, the same ones CI runs:

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

iOS client: open `iOS/CommuteWatch.xcodeproj` in Xcode and run on a simulator. It reads the web app at `http://localhost:3000` and falls back to its bundled sample data when that is not running. See [`iOS/README.md`](iOS/README.md).

## Status

- **The native client is a foundation.** It mirrors the web flows on the shared API, but it has no tests, has never been built in CI, and some flows are unfinished; [`iOS/README.md`](iOS/README.md) lists them.
- **Alert locations are approximate.** Transit alerts are scoped to routes, not points, so their pins come from landmark keywords or a default point per agency.
- **Camera images may be unavailable.** Caltrans snapshots go offline often; the app shows a placeholder. The sample cameras use stock photos, not real camera frames.
- **No retries.** A slow or rate-limited feed waits 10 seconds, then that source falls back to sample data until the next 60-second poll.
- **The route filter is a straight line.** "From" and "To" keep incidents within 5 km of the straight line between them, not along the driven route.

## More screenshots

Lane closure on the Bay Bridge approach, with the nearest Caltrans camera:

![Incident detail with nearby camera](docs/screenshots/incident-detail.jpg)

The route filter, Oakland to San Francisco:

![Route filter set from Oakland to San Francisco](docs/screenshots/commute-corridor.jpg)
