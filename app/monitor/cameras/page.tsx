"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cctv,
  Search,
  Filter,
  Plus,
  Smartphone,
  Video,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
  Shield,
  Radio,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection, saveDoc, removeDoc, logActivity } from "@/lib/firebase/data";
import { revokePairing } from "@/lib/firebase/pairing";
import { can } from "@/lib/roles";
import { StatusBadge } from "@/components/status-badge";
import { ConnectMobileModal } from "@/components/connect-mobile-modal";
import { AddCameraModal } from "@/components/add-camera-modal";
import { Camera, CameraStatus, School } from "@/types/monitor";
import { formatTimeAgo } from "@/lib/utils";

export default function CamerasManagerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { profile } = useAuth();
  const canEdit = can.editInfrastructure(profile?.role);
  const { data: cameras } = useCollection<Camera>("cameras");
  const { data: schools } = useCollection<School>("schools");

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cam.school_name && cam.school_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSchool =
      selectedSchool === "all" || cam.school_id === selectedSchool;

    const matchesStatus =
      selectedStatus === "all" || cam.status === selectedStatus;

    return matchesSearch && matchesSchool && matchesStatus;
  });

  const handleDelete = (cam: Camera) => {
    if (confirm(`¿Está seguro de dar de baja el dispositivo '${cam.name}' del Corredor Escolar?`)) {
      // Dar de baja una cámara celular también anula su enlace de vinculación.
      const revoke = cam.publish_token ? revokePairing(cam.publish_token) : Promise.resolve();
      revoke
        .then(() => removeDoc("cameras", cam.id))
        .catch((err) => console.error("[cameras]", err));
    }
  };

  const handleAddCamera = (newCam: Camera) => {
    saveDoc("cameras", newCam)
      .then(() =>
        logActivity({
          event_type: "camera_connected",
          title: "Cámara registrada",
          description: `${newCam.identifier} · ${newCam.name}`,
          entity_type: "camera",
          entity_id: newCam.id,
        })
      )
      .catch((err) => console.error("[cameras]", err));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="adm-label">
              GESTIÓN DE DISPOSITIVOS
            </span>
            <span className="text-xs text-muted">· {cameras.length} Cámaras Registradas</span>
          </div>
          <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Administrador de Cámaras
          </h1>
          <p className="text-xs text-muted">
            Control de puntos fijos de videovigilancia y transmisores móviles WebRTC
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3.5 py-2 text-xs font-semibold text-accent hover:bg-accent/25 transition-colors"
          >
            <Smartphone className="h-4 w-4" />
            <span>Conectar Dispositivo Móvil</span>
          </button>

          <button
            disabled={!canEdit}
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Cámara</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-panel p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID (CAM-...), nombre o calle..."
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--well)] py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* School filter */}
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground/85 focus:border-accent/50 focus:outline-none"
          >
            <option value="all">Todas las Escuelas</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--well)] px-3 py-2 text-xs text-foreground/85 focus:border-accent/50 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="alerta">Alerta</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Cameras Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-panel">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--well)] text-[11px] font-mono uppercase tracking-wider text-muted">
              <th className="py-3 px-4">Dispositivo</th>
              <th className="py-3 px-4">Escuela / Ubicación</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Resolución</th>
              <th className="py-3 px-4">Último Ping</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-xs">
            {filteredCameras.map((cam) => (
              <tr key={cam.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft border border-accent/20 text-accent shrink-0">
                      {cam.device_type === "mobile_webrtc" ? (
                        <Radio className="h-4 w-4 text-accent animate-pulse" />
                      ) : (
                        <Cctv className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{cam.name}</p>
                      <p className="font-mono text-[10px] text-muted">{cam.identifier}</p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <p className="font-medium text-foreground">{cam.school_name}</p>
                  <p className="text-[11px] text-muted">{cam.location_detail}</p>
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                  {cam.device_type === "mobile_webrtc"
                    ? "Móvil WebRTC"
                    : cam.device_type === "ptz_exterior"
                    ? "Domo PTZ"
                    : "IP Domo"}
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={cam.status} size="sm" />
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px] text-foreground/85">
                  {cam.resolution}
                  <span className="text-muted ml-1">@{cam.fps}fps</span>
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px] text-muted">
                  {cam.last_heartbeat ? formatTimeAgo(cam.last_heartbeat) : "Sin datos"}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/monitor/live?cam=${cam.id}`}
                      className="rounded p-1.5 text-muted hover:bg-white/[0.08] hover:text-foreground"
                      title="Ver en vivo"
                    >
                      <Video className="h-4 w-4" />
                    </Link>
                    <button
                      disabled={!canEdit}
                      onClick={() => handleDelete(cam)}
                      className="rounded p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-400"
                      title="Eliminar dispositivo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCameras.length === 0 && (
          <div className="py-12 text-center text-muted">
            <Cctv className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No se encontraron cámaras con los filtros aplicados</p>
          </div>
        )}
      </div>

      <ConnectMobileModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCamera={handleAddCamera}
      />
    </div>
  );
}
