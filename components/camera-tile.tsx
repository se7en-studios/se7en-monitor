"use client";

import { useState } from "react";
import { Cctv, Maximize2, Minimize2 } from "lucide-react";
import type { Camera } from "@/types/monitor";
import { StatusBadge } from "@/components/status-badge";
import {
  WebRTCReceiverTile,
  type ReceiverStatus,
} from "@/components/webrtc-receiver-tile";
import { DEVICE_LABELS, LOCATION_LABELS } from "@/lib/camera-labels";
import { formatTimeAgo } from "@/lib/utils";

interface CameraTileProps {
  camera: Camera;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenPairModal?: () => void;
}

/** Casillero de la grilla en vivo. Solo los celulares transmiten video real. */
export function CameraTile({
  camera,
  isExpanded,
  onToggleExpand,
  onOpenPairModal,
}: CameraTileProps) {
  const [receiver, setReceiver] = useState<ReceiverStatus | null>(null);
  const isMobile = camera.device_type === "mobile_webrtc";
  const isLive = isMobile && receiver === "live";

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">
            {camera.name}
          </p>
          <p className="font-mono text-[11px] text-muted">
            {camera.identifier}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              EN VIVO
            </span>
          )}
          <StatusBadge status={camera.status} size="sm" showDot={false} />
        </div>
      </header>

      {isMobile ? (
        <WebRTCReceiverTile
          token={camera.publish_token ?? ""}
          onStatusChange={setReceiver}
          onOpenPairModal={onOpenPairModal}
        />
      ) : (
        <IpCameraPlaceholder camera={camera} />
      )}

      <footer className="flex items-center justify-between gap-2 border-t border-[var(--line)] px-3 py-2 text-[12px] text-muted">
        <span className="truncate">
          {camera.school_name ?? "Sin escuela"} ·{" "}
          {LOCATION_LABELS[camera.location_type] ?? camera.location_type}
        </span>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Volver a la grilla" : "Ampliar cámara"}
          title={isExpanded ? "Volver a la grilla" : "Ampliar"}
          className="focus-ring rounded-full p-1.5 hover:bg-white/[0.06] hover:text-foreground"
        >
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </footer>
    </article>
  );
}

/** Las cámaras IP están registradas pero su video todavía no llega al panel. */
function IpCameraPlaceholder({ camera }: { camera: Camera }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[var(--well)] p-4 text-center">
      <Cctv className="h-6 w-6 text-muted" />
      <p className="text-[13px] font-medium text-foreground">
        Cámara IP registrada · video no integrado todavía
      </p>
      <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-left text-[12px] text-muted">
        <dt>Tipo</dt>
        <dd className="text-foreground/85">
          {DEVICE_LABELS[camera.device_type] ?? camera.device_type}
        </dd>
        <dt>Resolución</dt>
        <dd className="text-foreground/85">
          {camera.resolution || "Sin dato"}
        </dd>
        <dt>Última señal</dt>
        <dd className="text-foreground/85">
          {camera.last_heartbeat
            ? formatTimeAgo(camera.last_heartbeat)
            : "Todavía no transmitió"}
        </dd>
      </dl>
      {camera.location_detail && (
        <p className="max-w-xs truncate text-[11px] text-muted">
          {camera.location_detail}
        </p>
      )}
    </div>
  );
}
