"use client";

import { useCallback, useEffect, useState } from "react";

import { NotificationStore } from "@/services/notification-store";
import type { NotificationPreference } from "@/types";

export function useNotificationPreference() {
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference | null>(null);

  useEffect(() => {
    setNotificationPreference(NotificationStore.getNotificationPreference());
  }, []);

  const updateNotificationPreference = useCallback(
    (
      updater:
        NotificationPreference | ((current: NotificationPreference) => NotificationPreference)
    ) => {
      setNotificationPreference((current) => {
        const base = current ?? NotificationStore.getNotificationPreference();
        const nextValue = typeof updater === "function" ? updater(base) : updater;
        NotificationStore.saveNotificationPreference(nextValue);
        return nextValue;
      });
    },
    []
  );

  return { notificationPreference, updateNotificationPreference };
}
