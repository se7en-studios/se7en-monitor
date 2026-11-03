"use client";

import Link from "next/link";
import {
  Cctv,
  Link2Off,
  Pencil,
  Smartphone,
  Trash2,
  Video,
} from "lucide-react";
import type { Camera, School } from "@/types/monitor";
import type { PairingInfo } from "@/lib/firebase/pairing";
import { cameraCoverage, distanceMeters } from "@/lib/geo";
import { DEVICE_LABELS, LOCATION_LABELS } from "@/lib/camera-labels";
import { StatusBadge } from "@/components/status-badge";
import { formatTimeAgo } from "@/lib/utils";

interface CameraRowProps {
  camera: Camera;
  school: School | undefined;
  canEdit: boolean;
  /** Puede ver video en vivo (operadores y administración). */
  canWatch: boolean;
  /** Enlace vigente más reciente (solo lo ve la administración). */
  pairing: PairingInfo | undefined;
  busy: boolean;
  onEdit: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

function CoverageCell({
  camera,
  school,
}: {
  camera: Camera;
  school: School | undefined;
}) {
  const coverage = cameraCoverage(camera, school);
  if (coverage === "sin_ubicacion" || !school)
    return <span className="text-muted">Sin ubicación</span>;
  const d = Math.round(
    distanceMeters(school, { lat: camera.lat!, lng: camera.lng! }),
  );
  return coverage === "dentro" ? (
    <span className="text-emerald-300">Dentro · {d} m</span>
  ) : (
    <span className="text-red-400">
      Fuera · {d} m (límite {school.perimeter_radius_meters} m)
    </span>
  );
}

function PairingCell({
  camera,
  canEdit,
  pairing,
}: {
  camera: Camera;
  canEdit: boolean;
  pairing: PairingInfo | undefined;
}) {
  if (camera.device_type !== "mobile_webrtc")
    return <span className="text-muted">—</span>;
  // Solo la administración puede leer los enlaces (ver firestore.rules).
  if (!canEdit) return <span className="text-muted">Solo administración</span>;
  if (!pairing) return <span className="text-muted">Sin enlace</span>;
  if (pairing.expiresAt.getTime() < Date.now())
    return <span className="text-amber-300">Enlace vencido</span>;
  return (
    <span className="text-emerald-300">
      {pairing.claimed ? "En uso" : "Sin abrir"} · vence el{" "}
      {pairing.expiresAt.toLocaleDateString("es-AR")}
    </span>
  );
}

export function CameraRow({
  camera: cam,
  school,
  canEdit,
  canWatch,
  pairing,
  busy,
  onEdit,
  onRevoke,
  onDelete,
}: CameraRowProps) {
  const isMobile = cam.device_type === "mobile_webrtc";
  return (
    <tr className="hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-muted">
            {isMobile ? (
              <Smartphone className="h-4 w-4" />
            ) : (
              <Cctv className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="font-medium text-foreground">{cam.name}</p>
            <p className="font-mono text-[11px] text-muted">
              {cam.identifier} ·{" "}
              {DEVICE_LABELS[cam.device_type] ?? cam.device_type}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-foreground">{cam.school_name ?? "Sin escuela"}</p>
        <p className="text-[12px] text-muted">
          {LOCATION_LABELS[cam.location_type] ?? cam.location_type}
          {cam.location_detail && ` · ${cam.location_detail}`}
        </p>
      </td>
      <td className="px-4 py-3 text-[12px]">
        <CoverageCell camera={cam} school={school} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={cam.status} size="sm" />
      </td>
      <td className="px-4 py-3 font-mono text-[12px] text-muted">
        {cam.last_heartbeat
          ? formatTimeAgo(cam.last_heartbeat)
          : "Todavía no transmitió"}
      </td>
      <td className="px-4 py-3 text-[12px]">
        <PairingCell camera={cam} canEdit={canEdit} pairing={pairing} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {canWatch && (
            <IconLink href={`/monitor/live?cam=${cam.id}`} label="Ver en vivo">
              <Video className="h-4 w-4" />
            </IconLink>
          )}
          {canEdit && (
            <>
              <IconButton
                label="Editar cámara"
                onClick={onEdit}
                disabled={busy}
              >
                <Pencil className="h-4 w-4" />
              </IconButton>
              {isMobile && pairing && (
                <IconButton
                  label="Revocar enlace"
                  onClick={onRevoke}
                  disabled={busy}
                >
                  <Link2Off className="h-4 w-4" />
                </IconButton>
              )}
              <IconButton
                label="Dar de baja"
                onClick={onDelete}
                disabled={busy}
                danger
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

const ICON =
  "focus-ring rounded-full p-1.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40";

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={ICON} title={label} aria-label={label}>
      {children}
    </Link>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${ICON} ${danger ? "hover:text-red-400" : ""}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
