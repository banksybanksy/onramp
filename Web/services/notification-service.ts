"use client";

import type { Incident, NotificationPreference } from "@/types";

const MAX_DEDUPE_IDS = 40;

function severityRank(severity: Incident["severity"]) {
  return severity === "critical" ? 3 : severity === "major" ? 2 : 1;
}

function preferenceRank(severity: NotificationPreference["severityThreshold"]) {
  return severity === "critical" ? 3 : severity === "major" ? 2 : 1;
}

export const NotificationService = {
  isSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  },
  async requestPermission() {
    if (!this.isSupported()) {
      return "unsupported" as const;
    }

    return Notification.requestPermission();
  },
  shouldNotify({
    incident,
    preference
  }: {
    incident: Incident;
    preference: NotificationPreference;
  }) {
    if (!preference.enabled) {
      return false;
    }

    if (preference.recentNotificationIds.includes(incident.id)) {
      return false;
    }

    if (preference.watchedIncidentIds.includes(incident.id)) {
      return true;
    }

    if (
      incident.affectsMyCommute &&
      severityRank(incident.severity) >= preferenceRank(preference.severityThreshold)
    ) {
      return true;
    }

    return incident.affectsMyCommute && incident.relevanceScore >= 40;
  },
  pushRecentId(preference: NotificationPreference, id: string) {
    return {
      ...preference,
      recentNotificationIds: [
        id,
        ...preference.recentNotificationIds.filter((item) => item !== id)
      ].slice(0, MAX_DEDUPE_IDS)
    } satisfies NotificationPreference;
  },
  emitIncidentNotification(incident: Incident, onSelectIncident: (incidentId: string) => void) {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return;
    }

    const notification = new Notification(incident.title, {
      body: `${incident.subtitle} • ${incident.affectsMyCommute ? "Affects your commute" : incident.source}`,
      tag: incident.id
    });

    notification.onclick = () => {
      window.focus();
      onSelectIncident(incident.id);
      notification.close();
    };
  }
};
