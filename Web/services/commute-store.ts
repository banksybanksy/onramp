"use client";

import type { Commute, NotificationPreference } from "@/types";

const COMMUTE_STORAGE_KEY = "commutewatch:commute";
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

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const CommuteStore = {
  getCommute() {
    return readJson<Commute | null>(COMMUTE_STORAGE_KEY, null);
  },
  saveCommute(commute: Commute) {
    writeJson(COMMUTE_STORAGE_KEY, commute);
  },
  clearCommute() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(COMMUTE_STORAGE_KEY);
    }
  },
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
          : stored.lastPermissionState ?? Notification.permission
    } satisfies NotificationPreference;
  },
  saveNotificationPreference(preference: NotificationPreference) {
    writeJson(NOTIFICATION_STORAGE_KEY, preference);
  }
};
