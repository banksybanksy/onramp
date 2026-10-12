"use client";

import { PUBLIC_CONFIG } from "@/lib/config";

const VIEWPORT_STORAGE_KEY = "commutewatch:viewport";

export interface MapViewportState {
  center: [number, number];
  zoom: number;
}

// A corrupted or hand-edited entry would otherwise crash the map on load.
function isValidViewport(value: Partial<MapViewportState> | null): value is MapViewportState {
  return (
    !!value &&
    Array.isArray(value.center) &&
    value.center.length === 2 &&
    value.center.every(Number.isFinite) &&
    Number.isFinite(value.zoom)
  );
}

export const MapStateService = {
  getDefaultViewport(): MapViewportState {
    return {
      center: [PUBLIC_CONFIG.mapCenter.lng, PUBLIC_CONFIG.mapCenter.lat],
      zoom: PUBLIC_CONFIG.mapZoom
    };
  },
  saveViewport(viewport: MapViewportState) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
    } catch {
      // Storage can be unavailable (private mode, quota); the viewport just won't persist.
    }
  },
  loadViewport() {
    if (typeof window === "undefined") {
      return this.getDefaultViewport();
    }

    try {
      const value = window.localStorage.getItem(VIEWPORT_STORAGE_KEY);
      const stored = value ? (JSON.parse(value) as Partial<MapViewportState>) : null;
      return isValidViewport(stored) ? stored : this.getDefaultViewport();
    } catch {
      return this.getDefaultViewport();
    }
  }
};
