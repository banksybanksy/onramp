"use client";

import { useEffect, useState } from "react";

import type { GeocodeCandidate } from "@/types";

export function useGeocodeSuggestions(query: string) {
  const [results, setResults] = useState<GeocodeCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = (await response.json()) as { results: GeocodeCandidate[] };
        setResults(payload.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return { results, loading };
}
