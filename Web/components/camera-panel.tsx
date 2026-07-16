"use client";

import type { CameraFeed } from "@/types";

interface CameraPanelProps {
  camera: CameraFeed | null;
  onClose: () => void;
}

function buildSnapshotSrc(camera: CameraFeed) {
  if (!camera.thumbnailUrl) {
    return undefined;
  }

  try {
    const url = new URL(camera.thumbnailUrl);
    url.searchParams.set("_t", camera.updatedAt ?? Date.now().toString());
    return url.toString();
  } catch {
    const separator = camera.thumbnailUrl.includes("?") ? "&" : "?";
    return `${camera.thumbnailUrl}${separator}_t=${encodeURIComponent(camera.updatedAt ?? Date.now().toString())}`;
  }
}

export function CameraPanel({ camera, onClose }: CameraPanelProps) {
  if (!camera) return null;

  const snapshotSrc = buildSnapshotSrc(camera);

  return (
    <aside className="cw-scrollbar-none pointer-events-auto fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border border-slate-300 bg-[rgba(251,248,241,0.96)] p-5 shadow-[0_-12px_40px_rgba(39,54,74,0.18)] backdrop-blur-2xl md:inset-y-5 md:right-5 md:left-auto md:max-h-[calc(100vh-40px)] md:w-[390px] md:rounded-[28px]">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            {camera.source}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{camera.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cw-reflect-button shrink-0 rounded-[14px] border border-slate-300 p-2 text-slate-500 transition hover:border-slate-400 hover:bg-white/70"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {snapshotSrc ? (
        <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-300 bg-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <img
            src={snapshotSrc}
            alt={camera.title}
            className="w-full object-cover"
            style={{ height: "220px" }}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <span className="inline-flex rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Recent snapshot
        </span>
      </div>

      <div className="mt-4 rounded-[20px] border border-slate-300 bg-white/80 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
          Location
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {camera.locationHint ?? camera.title}
        </p>
      </div>

      {(camera.publicPageUrl ?? camera.streamUrl) ? (
        <div className="mt-6">
          <a
            href={camera.publicPageUrl ?? camera.streamUrl}
            target="_blank"
            rel="noreferrer"
            className="cw-reflect-button block rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Open feed
          </a>
        </div>
      ) : null}
    </aside>
  );
}
