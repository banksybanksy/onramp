# CommuteWatch

CommuteWatch is a map-first Bay Area transit and traffic alert app built with Next.js App Router, TypeScript, Tailwind CSS, and Mapbox GL JS.

## Quick start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and set any keys you want to enable:

- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` for the live Mapbox basemap and geocoding/directions APIs
- `BAY_511_API_KEY` to enable official 511 SF Bay traffic incidents and regional transit service alerts
- optional feed URL overrides if you want to replace the default 511/Caltrans sources

The app still runs without those values by falling back to bundled sample data.

## Live defaults

- Cameras default to the public Caltrans District 4 CCTV JSON feed
- Traffic incidents default to the official 511 SF Bay Traffic Events API when `BAY_511_API_KEY` is set
- Transit alerts default to the official 511 SF Bay regional GTFS-Realtime service alerts feed when `BAY_511_API_KEY` is set
