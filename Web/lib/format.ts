import { NO_TIMESTAMP_MINUTES } from "@/lib/geo";

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
  if (minutes >= NO_TIMESTAMP_MINUTES) {
    return "Time not reported";
  }

  if (minutes < 1) {
    return "Updated just now";
  }

  if (minutes < 60) {
    return `Updated ${Math.round(minutes)} min ago`;
  }

  const hours = Math.round(minutes / 60);
  return `Updated ${hours}h ago`;
}
