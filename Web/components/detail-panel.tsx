"use client";

import { formatTimestamp, formatRelativeMinutes } from "@/lib/format";
import { useEscapeKey } from "@/features/panels/use-escape-key";
import type { Incident } from "@/types";

import { CameraSnapshot } from "@/components/camera-snapshot";
import { SeverityBadge } from "@/components/severity-badge";

interface DetailPanelProps {
  incident: Incident | null;
  onClose: () => void;
}

export function DetailPanel({ incident, onClose }: DetailPanelProps) {
  useEscapeKey(onClose, incident !== null);

  if (!incident) return null;

  const camera = incident.camera && incident.camera.status !== "offline" ? incident.camera : null;
  const cameraLink = camera ? (camera.publicPageUrl ?? camera.streamUrl) : undefined;

  return (
    <aside
      aria-labelledby="incident-detail-title"
      className="cw-scrollbar-none pointer-events-auto fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border border-slate-300 bg-[rgba(251,248,241,0.96)] p-5 shadow-[0_-12px_40px_rgba(39,54,74,0.18)] backdrop-blur-2xl md:inset-y-5 md:right-5 md:left-auto md:max-h-[calc(100dvh-40px)] md:w-[390px] md:rounded-[28px]"
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            {incident.source}
          </p>
          <h2 id="incident-detail-title" className="mt-2 text-xl font-semibold text-slate-900">
            {incident.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{incident.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close incident details"
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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={incident.severity} />
        <span className="rounded-full border border-slate-300 px-3 py-1.5 text-xs tracking-[0.02em] text-slate-600">
          {formatRelativeMinutes(incident.freshnessMinutes)}
        </span>
      </div>

      <div className="mt-6 space-y-5 text-sm text-slate-700">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            What&rsquo;s happening
          </p>
          <p className="mt-2 leading-6">{incident.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Reported
            </p>
            <p className="mt-2">{formatTimestamp(incident.startTime)}</p>
          </div>
          {incident.agency !== "Other" ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Agency
              </p>
              <p className="mt-2">{incident.agency}</p>
            </div>
          ) : null}
        </div>

        {incident.affectedRoutes.length > 0 ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Affected routes
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {incident.affectedRoutes.map((route) => (
                <span
                  key={route}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
                >
                  {route}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {camera ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Nearby camera
            </p>
            <div className="mt-2 overflow-hidden rounded-[18px] border border-slate-300 bg-slate-100">
              <CameraSnapshot camera={camera} className="h-44 w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{camera.title}</p>
                  {camera.locationHint && camera.locationHint !== camera.title ? (
                    <p className="mt-0.5 text-xs text-slate-600">{camera.locationHint}</p>
                  ) : null}
                </div>
                {cameraLink ? (
                  <a
                    href={cameraLink}
                    target="_blank"
                    rel="noreferrer"
                    className="cw-reflect-button shrink-0 rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Open feed
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {incident.url && /^https?:\/\//.test(incident.url) ? (
        <div className="mt-6">
          <a
            href={incident.url}
            target="_blank"
            rel="noreferrer"
            className="cw-reflect-button block rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Source
          </a>
        </div>
      ) : null}
    </aside>
  );
}
