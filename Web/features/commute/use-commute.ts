"use client";

import { useCallback, useEffect, useState } from "react";

import { CommuteStore } from "@/services/commute-store";
import type { Commute, NotificationPreference } from "@/types";

export function useCommute() {
  const [commute, setCommute] = useState<Commute | null>(null);
  const [notificationPreference, setNotificationPreference] =
    useState<NotificationPreference | null>(null);

  useEffect(() => {
    setCommute(CommuteStore.getCommute());
    setNotificationPreference(CommuteStore.getNotificationPreference());
  }, []);

  const saveCommute = useCallback((nextCommute: Commute) => {
    CommuteStore.saveCommute(nextCommute);
    setCommute(nextCommute);
  }, []);

  const clearCommute = useCallback(() => {
    CommuteStore.clearCommute();
    setCommute(null);
  }, []);

  const updateNotificationPreference = useCallback(
    (
      updater:
        | NotificationPreference
        | ((current: NotificationPreference) => NotificationPreference)
    ) => {
      setNotificationPreference((current) => {
        const base = current ?? CommuteStore.getNotificationPreference();
        const nextValue = typeof updater === "function" ? updater(base) : updater;
        CommuteStore.saveNotificationPreference(nextValue);
        return nextValue;
      });
    },
    []
  );

  return {
    commute,
    notificationPreference,
    saveCommute,
    clearCommute,
    updateNotificationPreference
  };
}
