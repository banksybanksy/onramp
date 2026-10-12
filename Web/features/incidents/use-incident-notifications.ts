"use client";

import { useEffect } from "react";

import { NotificationStore } from "@/services/notification-store";
import { NotificationService } from "@/services/notification-service";
import type { Incident, NotificationPreference } from "@/types";

interface UseIncidentNotificationsOptions {
  incidents: Incident[];
  notificationPreference: NotificationPreference | null;
  onSelectIncident: (incidentId: string) => void;
  onPreferenceChange: (
    updater: NotificationPreference | ((current: NotificationPreference) => NotificationPreference)
  ) => void;
}

export function useIncidentNotifications({
  incidents,
  notificationPreference,
  onSelectIncident,
  onPreferenceChange
}: UseIncidentNotificationsOptions) {
  useEffect(() => {
    if (!notificationPreference || !NotificationService.isSupported()) {
      return;
    }

    if (Notification.permission !== notificationPreference.lastPermissionState) {
      onPreferenceChange((current) => ({
        ...current,
        lastPermissionState: Notification.permission
      }));
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const incidentToNotify = incidents.find((incident) =>
      NotificationService.shouldNotify({
        incident,
        preference: notificationPreference
      })
    );

    if (!incidentToNotify) {
      return;
    }

    NotificationService.emitIncidentNotification(incidentToNotify, onSelectIncident);
    const nextPreference = NotificationService.pushRecentId(
      notificationPreference,
      incidentToNotify.id
    );
    NotificationStore.saveNotificationPreference(nextPreference);
    onPreferenceChange(nextPreference);
  }, [incidents, notificationPreference, onPreferenceChange, onSelectIncident]);
}
