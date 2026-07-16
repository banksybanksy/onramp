export type Severity = "minor" | "major" | "critical";

export type Agency =
  | "BART"
  | "Muni"
  | "Caltrain"
  | "AC Transit"
  | "VTA"
  | "SamTrans"
  | "Other";

export type SourceKey = "transit" | "traffic" | "cameras";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface TransitAlert {
  id: string;
  agency: Agency;
  title: string;
  subtitle: string;
  description: string;
  severity: Severity;
  coordinate: Coordinate;
  affectedRoutes: string[];
  startTime?: string;
  endTime?: string;
  url?: string;
  source: string;
}

export interface TrafficIncident {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  severity: Severity;
  coordinate: Coordinate;
  startTime?: string;
  endTime?: string;
  url?: string;
  source: string;
  agency: Agency;
  roadNames: string[];
}

export interface CameraFeed {
  id: string;
  title: string;
  locationHint?: string;
  coordinate: Coordinate;
  source: string;
  agency: Agency;
  status: "available" | "limited" | "offline";
  publicPageUrl?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  updatedAt?: string;
}

export interface Incident {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  severity: Severity;
  source: string;
  agency: Agency;
  coordinate: Coordinate;
  startTime?: string;
  endTime?: string;
  url?: string;
  affectedRoutes: string[];
  cameraReference?: string;
  camera?: CameraFeed | null;
  isTransit: boolean;
  isTraffic: boolean;
  rawSourceType: "transit" | "traffic";
  freshnessMinutes: number;
  relevanceScore: number;
  affectsMyCommute?: boolean;
  commuteReasons?: string[];
}

export interface CommuteLocation {
  label: string;
  coordinate: Coordinate;
  context?: string;
}

export interface Commute {
  origin: CommuteLocation;
  destination: CommuteLocation;
  preferredAgencies: Agency[];
  routeGeometry?: Coordinate[];
  savedAt: string;
}

export interface NotificationPreference {
  enabled: boolean;
  severityThreshold: Severity;
  watchedIncidentIds: string[];
  watchedCameraIds: string[];
  recentNotificationIds: string[];
  lastPermissionState?: NotificationPermission | "unsupported";
}

export interface SourceStatus {
  key: SourceKey;
  label: string;
  ok: boolean;
  mode: "live" | "partial" | "fallback";
  itemCount: number;
  updatedAt: string;
  endpoint?: string;
  message?: string;
}

export interface ServiceResult<T> {
  data: T;
  sourceStatus: SourceStatus;
  warnings: string[];
}

export interface IncidentsResponse {
  incidents: Incident[];
  cameras: CameraFeed[];
  sourceStatus: Record<SourceKey, SourceStatus>;
  updatedAt: string;
}

export interface GeocodeCandidate {
  id: string;
  label: string;
  coordinate: Coordinate;
  context?: string;
}

export interface CommuteRouteResponse {
  geometry: Coordinate[];
  mode: "live" | "fallback";
  distanceKm: number;
}
