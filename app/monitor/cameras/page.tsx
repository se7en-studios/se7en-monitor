"use client";

import { useState } from "react";
import { Cctv, Plus, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { logActivity, saveDoc, useCollection } from "@/lib/firebase/data";
import {
  removeCamera,
  revokeCameraPairing,
  usePairingExpirations,
} from "@/lib/firebase/pairing";
import { can } from "@/lib/roles";
import { CAMERA_STATUS_LABELS } from "@/lib/camera-labels";
import type { Camera, CameraStatus, School } from "@/types/monitor";
import { AddCameraModal } from "@/components/add-camera-modal";
import { ConnectMobileModal } from "@/components/connect-mobile-modal";
import { EditCameraModal } from "@/components/edit-camera-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { describeError, useToast } from "@/components/toast";
import {
  EmptyState,
  PageHeader,
  btnPrimary,
  btnSecondary,
  input,
  searchInput,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { CameraRow } from "./camera-row";

type Pending = { kind: "delete" | "revoke"; camera: Camera } | null;

export default function CamerasManagerPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const canEdit = can.editInfrastructure(profile?.role);
  const { data: cameras, loading } = useCollection<Camera>("cameras");
  const { data: schools } = useCollection<School>("schools");
  const expirations = usePairingExpirations(canEdit);
  const [term, setTerm] = useState("");
  const [schoolId, setSchoolId] = useState("all");
  const [status, setStatus] = useState<CameraStatus | "all">("all");
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Camera | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const t = term.trim().toLowerCase();
  const filtered = cameras.filter(
    (c) =>
      (!t ||
        [c.name, c.identifier, c.school_name, c.location_detail].some((v) =>
          (v ?? "").toLowerCase().includes(t),
        )) &&
      (schoolId === "all" || c.school_id === schoolId) &&
      (status === "all" || c.status === status),
  );

  const addCamera = async (cam: Camera) => {
    await saveDoc("cameras", cam);
    toast.success(`Cámara ${cam.identifier} dada de alta`);
    void logActivity({
      event_type: "camera_connected",
      title: "Cámara registrada",
      description: `${cam.identifier} · ${cam.name}`,
      entity_type: "camera",
      entity_id: cam.id,
    });
  };

  const confirmPending = async () => {
    if (!pending) return;
    const { kind, camera } = pending;
    setBusyId(camera.id);
    try {
      await (kind === "delete"
        ? removeCamera(camera)
        : revokeCameraPairing(camera));
      toast.success(
        kind === "delete"
          ? `${camera.identifier} dada de baja`
          : "Enlace revocado: el celular ya no puede transmitir",
      );
      setPending(null);
    } catch (err) {
      console.error("[cámaras]", err);
      toast.error(
        describeError(
          err,
          kind === "delete"
            ? "No se pudo dar de baja la cámara."
            : "No se pudo revocar el enlace.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${cameras.length} cámaras registradas`}
        title="Cámaras del"
        accent="corredor"
        right={
          canEdit && (
            <>
              <button
                className={btnSecondary}
                onClick={() => setIsConnectOpen(true)}
              >
                <Smartphone className="h-4 w-4" /> Vincular celular
              </button>
              <button className={btnPrimary} onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4" /> Agregar cámara
              </button>
            </>
          )
        }
      >
        Cada cámara debe estar dentro del radio de su escuela. Los celulares
        transmiten con un enlace que vence.
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          aria-label="Buscar cámaras"
          placeholder="Buscar por nombre, identificador o lugar…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className={cn(searchInput, "pl-3 md:max-w-md")}
        />
        <select
          aria-label="Filtrar por escuela"
          className={cn(input, "w-auto rounded-full")}
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
        >
          <option value="all">Todas las escuelas</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado"
          className={cn(input, "w-auto rounded-full")}
          value={status}
          onChange={(e) => setStatus(e.target.value as CameraStatus | "all")}
        >
          <option value="all">Todos los estados</option>
          {(Object.keys(CAMERA_STATUS_LABELS) as CameraStatus[]).map((s) => (
            <option key={s} value={s}>
              {CAMERA_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={<Cctv className="h-6 w-6" />}
          title={
            cameras.length
              ? "No hay cámaras con estos filtros"
              : "Todavía no hay cámaras"
          }
        >
          {cameras.length
            ? "Probá con otra escuela o estado."
            : canEdit
              ? "Agregá la primera con «Agregar cámara»."
              : "La administración todavía no dio de alta ninguna."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--panel)]">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] font-mono text-[11px] tracking-wider text-muted uppercase">
                <th className="px-4 py-3">Cámara</th>
                <th className="px-4 py-3">Escuela / ubicación</th>
                <th className="px-4 py-3">Corredor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Última señal</th>
                <th className="px-4 py-3">Enlace</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-muted">
                    Cargando…
                  </td>
                </tr>
              )}
              {filtered.map((cam) => (
                <CameraRow
                  key={cam.id}
                  camera={cam}
                  school={schools.find((s) => s.id === cam.school_id)}
                  canEdit={canEdit}
                  pairingExpires={
                    cam.publish_token
                      ? expirations.get(cam.publish_token)
                      : undefined
                  }
                  busy={busyId === cam.id}
                  onEdit={() => setEditing(cam)}
                  onRevoke={() => setPending({ kind: "revoke", camera: cam })}
                  onDelete={() => setPending({ kind: "delete", camera: cam })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        danger
        title={
          pending?.kind === "delete"
            ? `¿Dar de baja ${pending.camera.identifier}?`
            : "¿Revocar el enlace del celular?"
        }
        confirmLabel={
          pending?.kind === "delete" ? "Dar de baja" : "Revocar enlace"
        }
        busy={!!pending && busyId === pending.camera.id}
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmPending()}
      >
        {pending?.kind === "delete"
          ? `«${pending.camera.name}» deja de aparecer en el monitoreo${pending.camera.publish_token ? " y su enlace de celular se anula" : ""}. No se puede deshacer.`
          : "El celular deja de poder transmitir. Para volver a usarlo hay que generar un enlace nuevo."}
      </ConfirmDialog>

      {isConnectOpen && (
        <ConnectMobileModal isOpen onClose={() => setIsConnectOpen(false)} />
      )}
      <AddCameraModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddCamera={addCamera}
      />
      {editing && (
        <EditCameraModal camera={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
