"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PUBLIC_CONFIG } from "@/lib/config";
import type { IncidentsResponse } from "@/types";

interface UseIncidentsOptions {
  initialData: IncidentsResponse;
}

export function useIncidents({ initialData }: UseIncidentsOptions) {
  const [data, setData] = useState<IncidentsResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard against concurrent requests: if the previous poll hasn't resolved
  // before the next interval fires, skip that tick rather than stacking fetches.
  const isFetchingRef = useRef(false);

  const fetchSnapshot = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/incidents", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load incidents (${response.status})`);
      }

      const payload = (await response.json()) as IncidentsResponse;
      setData(payload);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to refresh live incidents"
      );
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(fetchSnapshot, PUBLIC_CONFIG.notificationPollMs);
    return () => window.clearInterval(interval);
  }, [fetchSnapshot]);

  return {
    data,
    loading,
    error,
    refresh: fetchSnapshot
  };
}
