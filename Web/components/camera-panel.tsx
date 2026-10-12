"use client";

import { CameraSnapshot } from "@/components/camera-snapshot";
import { useEscapeKey } from "@/features/panels/use-escape-key";
import type { CameraFeed } from "@/types";

interface CameraPanelProps {
  camera: CameraFeed | null;
  onClose: () => void;
}

export function CameraPanel({ camera, onClose }: CameraPanelProps) {
  useEscapeKey(onClose, camera !== null);

  if (!camera) return null;

  const cameraLink = camera.publicPageUrl ?? camera.streamUrl;

  return (
    <aside
      aria-labelledby="camera-detail-title"
      className="cw-scrollbar-none pointer-events-auto fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border border-slate-300 bg-[rgba(251,248,241,0.96)] p-5 shadow-[0_-12px_40px_rgba(39,54,74,0.18)] backdrop-blur-2xl md:inset-y-5 md:right-5 md:left-auto md:max-h-[calc(100dvh-40px)] md:w-[390px] md:rounded-[28px]"
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            {camera.source}
          </p>
          <h2 id="camera-detail-title" className="mt-2 text-xl font-semibold text-slate-900">
            {camera.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera details"
          className="cw-reflect-button shrink-0 rounded-[14px] border border-slate-300 p-2 text-slate-500 transition hover:border-slate-400 hover:bg-white/70"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-slate-300 bg-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
        <CameraSnapshot camera={camera} className="h-[220px] w-full object-cover" />
      </div>

      <div className="mt-4 rounded-[20px] border border-slate-300 bg-white/80 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Location</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {camera.locationHint ?? camera.title}
        </p>
      </div>

      {cameraLink ? (
        <div className="mt-6">
          <a
            href={cameraLink}
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
