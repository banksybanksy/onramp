"use client";

import { useState } from "react";

import type { CameraFeed } from "@/types";

interface CameraSnapshotProps {
  camera: CameraFeed;
  className?: string;
}

// Caltrans serves snapshots at a fixed URL; the timestamp keeps the browser
// from showing a stale cached frame.
function snapshotUrl({ thumbnailUrl, updatedAt }: CameraFeed) {
  if (!thumbnailUrl) {
    return undefined;
  }

  const stamp = updatedAt ?? Date.now().toString();
  try {
    const url = new URL(thumbnailUrl);
    url.searchParams.set("_t", stamp);
    return url.toString();
  } catch {
    return undefined;
  }
}

// Caltrans snapshots are often offline; show a placeholder instead of a broken image.
export function CameraSnapshot({ camera, className }: CameraSnapshotProps) {
  const src = snapshotUrl(camera);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 px-4 text-center text-xs text-slate-600 ${className ?? ""}`}
      >
        {src ? "Camera image unavailable right now" : "This camera has no snapshot"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote camera snapshots, not optimizable assets
    <img
      src={src}
      alt={`Snapshot from ${camera.title}`}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
