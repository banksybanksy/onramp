export function formatTimestamp(iso?: string) {
  if (!iso) {
    return "Unknown";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatRelativeMinutes(minutes: number) {
  if (minutes < 1) {
    return "Updated just now";
  }

  if (minutes < 60) {
    return `Updated ${Math.round(minutes)} min ago`;
  }

  const hours = Math.round(minutes / 60);
  return `Updated ${hours}h ago`;
}

export function formatDistanceKm(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}
