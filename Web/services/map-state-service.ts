"use client";

import { PUBLIC_CONFIG } from "@/lib/config";

const VIEWPORT_STORAGE_KEY = "commutewatch:viewport";

export interface MapViewportState {
  center: [number, number];
  zoom: number;
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

    window.localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
  },
  loadViewport() {
    if (typeof window === "undefined") {
      return this.getDefaultViewport();
    }

    try {
      const value = window.localStorage.getItem(VIEWPORT_STORAGE_KEY);
      return value ? (JSON.parse(value) as MapViewportState) : this.getDefaultViewport();
    } catch {
      return this.getDefaultViewport();
    }
  }
};
