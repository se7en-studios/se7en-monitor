"use client";

import { useState } from "react";
import { X, Cctv, Shield, MapPin, Radio, Plus } from "lucide-react";
import { Camera, CameraDeviceType, CameraLocationType } from "@/types/monitor";
import { useCollection } from "@/lib/firebase/data";
import type { School } from "@/types/monitor";

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCamera: (camera: Camera) => void;
}

export function AddCameraModal({ isOpen, onClose, onAddCamera }: AddCameraModalProps) {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const { data: schools } = useCollection<School>("schools");
  const [pickedSchool, setSchoolId] = useState("");
  const schoolId = pickedSchool || schools[0]?.id || "";
  const [locationType, setLocationType] = useState<CameraLocationType>("acceso_principal");
  const [locationDetail, setLocationDetail] = useState("");
  const [deviceType, setDeviceType] = useState<CameraDeviceType>("ip_dome");
  const [ipAddress, setIpAddress] = useState("192.168.10.55");
  const [resolution, setResolution] = useState("1080p FHD");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !identifier || !schoolId) return;

    const school = schools.find((s) => s.id === schoolId);

    const newCamera: Camera = {
      id: "cam-" + Math.random().toString(36).substring(2, 7),
      school_id: schoolId,
      school_name: school?.name || "Escuela Catriel",
      identifier,
      name,
      location_type: locationType,
      location_detail: locationDetail || "Punto de monitoreo perimetral 200m",
      device_type: deviceType,
      status: "online",
      last_heartbeat: new Date().toISOString(),
      ip_address: ipAddress,
      stream_type: "webrtc",
      resolution,
      fps: 30,
      is_live: true,
      installed_at: new Date().toISOString().split("T")[0],
    };

    onAddCamera(newCamera);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#0c101a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Cctv className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instalar Nuevo Punto de Monitoreo</h3>
            <p className="text-xs text-slate-400">
              Alta técnica de cámara fija perimetral o domo urbano en Catriel
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Identificador Único
              </label>
              <input
                type="text"
                required
                placeholder="ej: CAM-204-NORTE"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Tipo de Dispositivo
              </label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as CameraDeviceType)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="ip_dome">IP Domo Antivandálico</option>
                <option value="ptz_exterior">Domo PTZ 360°</option>
                <option value="ip_bullet">Bullet Perimetral Exterior</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Nombre Descriptivo de la Cámara
            </label>
            <input
              type="text"
              required
              placeholder="ej: Portón Ingreso Turno Mañana"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Establecimiento Educativo Asignado
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.neighborhood}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Zona de Monitoreo
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as CameraLocationType)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="acceso_principal">Acceso Principal</option>
                <option value="corredor_escolar">Corredor Seguro (200m)</option>
                <option value="perimetro_exterior">Perímetro Exterior</option>
                <option value="patio_general">Patio General</option>
                <option value="porton_secundario">Portón Secundario</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Resolución
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="1080p FHD">1080p FHD (30 FPS)</option>
                <option value="2K QHD">2K QHD (30 FPS)</option>
                <option value="4K UHD">4K UHD (60 FPS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Detalle de Montaje o Columna
            </label>
            <input
              type="text"
              placeholder="ej: Poste Alumbrado Público N° 42 esq. Rawson"
              value={locationDetail}
              onChange={(e) => setLocationDetail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              Conectar y Activar Cámara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

