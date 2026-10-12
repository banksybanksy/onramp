import type { MapState } from "@/components/map-canvas";

const NOTICES: Partial<Record<MapState, { title: string; body: string }>> = {
  "missing-token": {
    title: "Map off: no Mapbox token",
    body: "The incident list still works. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to Web/.env.local to draw the map."
  },
  error: {
    title: "Map failed to load",
    body: "Check that NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is a valid public token for this domain."
  }
};

// Sits in the incident column on small screens, where the map corner is covered
// by the list, and floats bottom-right on wide screens.
export function MapNotice({ state }: { state: MapState }) {
  const notice = NOTICES[state];
  if (!notice) return null;

  return (
    <div
      role="status"
      className="rounded-[20px] border border-amber-200 bg-[rgba(255,250,240,0.96)] px-4 py-3 text-sm text-amber-900 shadow-[0_10px_30px_rgba(120,73,0,0.14)] backdrop-blur-xl lg:fixed lg:bottom-6 lg:right-6 lg:max-w-sm"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800">
        {notice.title}
      </p>
      <p className="mt-1">{notice.body}</p>
    </div>
  );
}
