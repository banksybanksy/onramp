"use client";

import { useState } from "react";

interface CameraSnapshotProps {
  src: string;
  alt: string;
  className?: string;
}

// Caltrans snapshots are frequently offline; show a placeholder instead of a broken image.
export function CameraSnapshot({ src, alt, className }: CameraSnapshotProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 px-4 text-center text-xs text-slate-500 ${className ?? ""}`}
      >
        Camera image temporarily unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote camera snapshots, not optimizable assets
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
