"use client";

import type { NotificationPreference } from "@/types";

const NOTIFICATION_STORAGE_KEY = "commutewatch:notification-preference";

const defaultNotificationPreference: NotificationPreference = {
  enabled: false,
  severityThreshold: "major",
  watchedIncidentIds: [],
  watchedCameraIds: [],
  recentNotificationIds: [],
  lastPermissionState:
    typeof window === "undefined" || typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission
};

function readJson<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota); the preference just won't persist.
  }
}

export const NotificationStore = {
  getNotificationPreference() {
    const stored = readJson<NotificationPreference>(
      NOTIFICATION_STORAGE_KEY,
      defaultNotificationPreference
    );

    return {
      ...defaultNotificationPreference,
      ...stored,
      watchedIncidentIds: stored.watchedIncidentIds ?? [],
      watchedCameraIds: stored.watchedCameraIds ?? [],
      recentNotificationIds: stored.recentNotificationIds ?? [],
      lastPermissionState:
        typeof Notification === "undefined"
          ? "unsupported"
          : (stored.lastPermissionState ?? Notification.permission)
    } satisfies NotificationPreference;
  },
  saveNotificationPreference(preference: NotificationPreference) {
    writeJson(NOTIFICATION_STORAGE_KEY, preference);
  }
};
