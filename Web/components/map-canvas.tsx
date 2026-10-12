"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, MapLayerMouseEvent, Popup } from "mapbox-gl";

import { PUBLIC_CONFIG } from "@/lib/config";
import { MapStateService } from "@/services/map-state-service";
import type { CameraFeed, Incident } from "@/types";

interface MapCanvasProps {
  incidents: Incident[];
  cameras: CameraFeed[];
  selectedIncidentId: string | null;
  recenterSignal: number;
  locateSignal: number;
  onSelectIncident: (incidentId: string) => void;
  onSelectCamera: (cameraId: string) => void;
}

const INCIDENT_SOURCE_ID = "cw-incidents";
const INCIDENT_HALO_LAYER_ID = "cw-incidents-halo";
const INCIDENT_LAYER_ID = "cw-incidents-circle";
const INCIDENT_SYMBOL_LAYER_ID = "cw-incidents-symbol";
const CAMERA_SOURCE_ID = "cw-cameras";
const CAMERA_LAYER_ID = "cw-cameras-circle";
const CAMERA_SYMBOL_LAYER_ID = "cw-cameras-symbol";

function buildIncidentGeoJson(
  incidents: Incident[],
  selectedIncidentId: string | null
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: incidents.map((incident) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [incident.coordinate.lng, incident.coordinate.lat]
      },
      properties: {
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        markerType: incident.isTransit ? "transit" : "traffic",
        glyph: incident.isTransit ? (incident.agency === "BART" ? "B" : "M") : "!",
        selected: incident.id === selectedIncidentId ? 1 : 0,
        commute: incident.affectsMyCommute ? 1 : 0
      }
    }))
  };
}

function buildCameraGeoJson(cameras: CameraFeed[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: cameras.map((camera) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [camera.coordinate.lng, camera.coordinate.lat]
      },
      properties: {
        id: camera.id,
        title: camera.title,
        locationHint: camera.locationHint ?? deriveCameraLocationHint(camera.title),
        glyph: "C"
      }
    }))
  };
}

function deriveCameraLocationHint(title: string) {
  const withoutPrefix = title.replace(/^TV\d+\s*--\s*/i, "").replace(/\s+camera$/i, "").trim();

  if (withoutPrefix.includes(" : ")) {
    const [roadway, crossStreet] = withoutPrefix.split(/\s:\s/, 2);
    return `${roadway} near ${crossStreet}`;
  }

  return withoutPrefix;
}


function ensureMapLayers(map: mapboxgl.Map) {
  if (!map.getSource(INCIDENT_SOURCE_ID)) {
    map.addSource(INCIDENT_SOURCE_ID, {
      type: "geojson",
      data: buildIncidentGeoJson([], null)
    });
  }

  if (!map.getLayer(INCIDENT_HALO_LAYER_ID)) {
    map.addLayer({
      id: INCIDENT_HALO_LAYER_ID,
      type: "circle",
      source: INCIDENT_SOURCE_ID,
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "selected"], 1],
          17,
          ["==", ["get", "commute"], 1],
          14,
          0
        ],
        "circle-color": [
          "case",
          ["==", ["get", "selected"], 1],
          "#1d4ed8",
          "#93c5fd"
        ],
        "circle-opacity": [
          "case",
          ["==", ["get", "selected"], 1],
          0.22,
          ["==", ["get", "commute"], 1],
          0.16,
          0
        ]
      }
    });
  }

  if (!map.getLayer(INCIDENT_LAYER_ID)) {
    map.addLayer({
      id: INCIDENT_LAYER_ID,
      type: "circle",
      source: INCIDENT_SOURCE_ID,
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "selected"], 1],
          ["match", ["get", "severity"], "critical", 11, "major", 10, 9],
          ["match", ["get", "severity"], "critical", 10, "major", 9, 8]
        ],
        "circle-color": [
          "match",
          ["get", "markerType"],
          "traffic",
          "#fff4ef",
          "#ffffff"
        ],
        "circle-stroke-width": [
          "match",
          ["get", "severity"],
          "critical",
          3,
          "major",
          2.5,
          2
        ],
        "circle-stroke-color": [
          "match",
          ["get", "markerType"],
          "traffic",
          "#d64d3a",
          "#3567eb"
        ]
      }
    });
  }

  if (!map.getLayer(INCIDENT_SYMBOL_LAYER_ID)) {
    map.addLayer({
      id: INCIDENT_SYMBOL_LAYER_ID,
      type: "symbol",
      source: INCIDENT_SOURCE_ID,
      layout: {
        "text-field": ["get", "glyph"],
        "text-size": 10,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": [
          "match",
          ["get", "markerType"],
          "traffic",
          "#d64d3a",
          "#3567eb"
        ]
      }
    });
  }

  if (!map.getSource(CAMERA_SOURCE_ID)) {
    map.addSource(CAMERA_SOURCE_ID, {
      type: "geojson",
      data: buildCameraGeoJson([])
    });
  }

  if (!map.getLayer(CAMERA_LAYER_ID)) {
    map.addLayer({
      id: CAMERA_LAYER_ID,
      type: "circle",
      source: CAMERA_SOURCE_ID,
      paint: {
        "circle-radius": 7,
        "circle-color": "#f8f5ff",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#7258ff"
      }
    });
  }

  if (!map.getLayer(CAMERA_SYMBOL_LAYER_ID)) {
    map.addLayer({
      id: CAMERA_SYMBOL_LAYER_ID,
      type: "symbol",
      source: CAMERA_SOURCE_ID,
      layout: {
        "text-field": ["get", "glyph"],
        "text-size": 9,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": "#7258ff"
      }
    });
  }
}

export function MapCanvas({
  incidents,
  cameras,
  selectedIncidentId,
  recenterSignal,
  locateSignal,
  onSelectIncident,
  onSelectCamera
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const userMarkerRef = useRef<{ remove: () => void } | null>(null);
  const onSelectIncidentRef = useRef(onSelectIncident);
  const onSelectCameraRef = useRef(onSelectCamera);
  const cameraLookupRef = useRef(new Map<string, CameraFeed>());
  const hasToken = Boolean(PUBLIC_CONFIG.mapboxToken);
  const [mapReady, setMapReady] = useState(false);
  const [mapMode, setMapMode] = useState<"mapbox" | "error" | "missing">(
    hasToken ? "mapbox" : "missing"
  );

  const visibleCameras = useMemo(
    () => cameras.filter((camera) => camera.status !== "offline"),
    [cameras]
  );

  useEffect(() => {
    onSelectIncidentRef.current = onSelectIncident;
  }, [onSelectIncident]);

  useEffect(() => {
    onSelectCameraRef.current = onSelectCamera;
  }, [onSelectCamera]);

  useEffect(() => {
    cameraLookupRef.current = new Map(visibleCameras.map((camera) => [camera.id, camera]));
  }, [visibleCameras]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasToken) {
      return;
    }

    let mounted = true;

    void (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxRef.current = mapboxgl;
      mapboxgl.accessToken = PUBLIC_CONFIG.mapboxToken;

      const viewport = MapStateService.loadViewport();
      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: PUBLIC_CONFIG.mapStyle,
        center: viewport.center,
        zoom: viewport.zoom,
        pitch: 0,
        bearing: 0,
        attributionControl: false
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

      const handleIncidentClick = (event: MapLayerMouseEvent) => {
        const incidentId = event.features?.[0]?.properties?.id;
        if (typeof incidentId === "string") {
          popupRef.current?.remove();
          onSelectIncidentRef.current(incidentId);
        }
      };

      const handleCameraClick = (event: MapLayerMouseEvent) => {
        const cameraId = event.features?.[0]?.properties?.id;
        if (typeof cameraId !== "string") return;
        popupRef.current?.remove();
        onSelectCameraRef.current(cameraId);
      };

      const setPointer = () => {
        map.getCanvas().style.cursor = "pointer";
      };

      const clearPointer = () => {
        map.getCanvas().style.cursor = "";
      };

      map.on("load", () => {
        if (!mounted) {
          return;
        }

        ensureMapLayers(map);
        setMapMode("mapbox");
        setMapReady(true);
      });

      map.on("error", () => {
        if (!mounted) {
          return;
        }

        setMapMode("error");
      });

      map.on("moveend", () => {
        MapStateService.saveViewport({
          center: [map.getCenter().lng, map.getCenter().lat],
          zoom: map.getZoom()
        });
      });

      map.on("click", INCIDENT_LAYER_ID, handleIncidentClick);
      map.on("click", INCIDENT_SYMBOL_LAYER_ID, handleIncidentClick);
      map.on("click", CAMERA_LAYER_ID, handleCameraClick);
      map.on("click", CAMERA_SYMBOL_LAYER_ID, handleCameraClick);
      map.on("mouseenter", INCIDENT_LAYER_ID, setPointer);
      map.on("mouseenter", INCIDENT_SYMBOL_LAYER_ID, setPointer);
      map.on("mouseenter", CAMERA_LAYER_ID, setPointer);
      map.on("mouseenter", CAMERA_SYMBOL_LAYER_ID, setPointer);
      map.on("mouseleave", INCIDENT_LAYER_ID, clearPointer);
      map.on("mouseleave", INCIDENT_SYMBOL_LAYER_ID, clearPointer);
      map.on("mouseleave", CAMERA_LAYER_ID, clearPointer);
      map.on("mouseleave", CAMERA_SYMBOL_LAYER_ID, clearPointer);

      mapRef.current = map;
    })();

    return () => {
      mounted = false;
      const popup = popupRef.current;
      const userMarker = userMarkerRef.current;
      const mapInstance = mapRef.current;
      popup?.remove();
      userMarker?.remove();
      mapInstance?.remove();
      mapRef.current = null;
    };
  }, [hasToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const source = map.getSource(INCIDENT_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(buildIncidentGeoJson(incidents, selectedIncidentId));
  }, [incidents, mapReady, selectedIncidentId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const source = map.getSource(CAMERA_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(buildCameraGeoJson(visibleCameras));
  }, [mapReady, visibleCameras]);

  useEffect(() => {
    if (!recenterSignal || !mapRef.current || !mapReady) {
      return;
    }

    mapRef.current.easeTo({
      center: [PUBLIC_CONFIG.mapCenter.lng, PUBLIC_CONFIG.mapCenter.lat],
      zoom: PUBLIC_CONFIG.mapZoom,
      duration: 800
    });
  }, [recenterSignal, mapReady]);

  useEffect(() => {
    if (!locateSignal || !mapRef.current || !mapboxRef.current || !mapReady) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinate: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        const markerElement = document.createElement("span");
        markerElement.className = "cw-user-marker";

        userMarkerRef.current?.remove();
        userMarkerRef.current = new mapboxRef.current!.Marker({
          element: markerElement,
          anchor: "center"
        })
          .setLngLat(coordinate)
          .addTo(mapRef.current!);

        mapRef.current!.easeTo({
          center: coordinate,
          zoom: 11.8,
          duration: 900
        });
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );
  }, [locateSignal, mapReady]);

  useEffect(() => {
    if (!selectedIncidentId || !mapRef.current || !mapReady) {
      return;
    }

    const selected = incidents.find((incident) => incident.id === selectedIncidentId);
    if (!selected) {
      return;
    }

    mapRef.current.easeTo({
      center: [selected.coordinate.lng, selected.coordinate.lat],
      zoom: Math.max(mapRef.current.getZoom(), 11.5),
      duration: 700
    });
  }, [selectedIncidentId, incidents, mapReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!hasToken || (mapMode === "error" && !mapReady) ? (
        <div className="pointer-events-none absolute bottom-5 right-5 rounded-[20px] border border-amber-200 bg-[rgba(255,250,240,0.96)] px-4 py-3 text-sm text-amber-800 shadow-[0_10px_30px_rgba(120,73,0,0.14)] backdrop-blur-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-700">
            {hasToken ? "Map failed to load" : "Mapbox token needed"}
          </p>
          <p className="mt-1 max-w-xs">
            {hasToken
              ? "Check that NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is a valid public token for this domain."
              : "Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local to render the map."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
