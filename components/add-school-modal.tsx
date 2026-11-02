"use client";

import { useState } from "react";
import { X, School, MapPin, Phone, Mail, User, ShieldCheck } from "lucide-react";
import { School as SchoolType, EducationalLevel } from "@/types/monitor";

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSchool: (school: SchoolType) => void;
}

export function AddSchoolModal({ isOpen, onClose, onAddSchool }: AddSchoolModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("Centro");
  const [level, setLevel] = useState<EducationalLevel>("primario");
  const [principalName, setPrincipalName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !address) return;

    const newSchool: SchoolType = {
      id: "sch-" + Math.random().toString(36).substring(2, 7),
      code,
      name,
      address,
      neighborhood,
      city: "Catriel",
      province: "Río Negro",
      lat: -37.8812 + (Math.random() - 0.5) * 0.01,
      lng: -67.7955 + (Math.random() - 0.5) * 0.01,
      educational_level: level,
      principal_name: principalName || "A designar",
      phone: phone || "(0299) 491-0000",
      email: email || `${code.toLowerCase()}@educacion.rn.gov.ar`,
      perimeter_radius_meters: 200,
      cameras_count: 0,
      status: "operativo",
      created_at: new Date().toISOString(),
    };

    onAddSchool(newSchool);
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
            <School className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Registrar Establecimiento Educativo</h3>
            <p className="text-xs text-slate-400">
              Incorporación al programa de Corredor Escolar Cuidado de Catriel (Radio 200m)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Código Institucional
              </label>
              <input
                type="text"
                required
                placeholder="ej: ESC-218"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Nivel Educativo
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationalLevel)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="inicial">Inicial / Jardín</option>
                <option value="primario">Primario</option>
                <option value="secundario">Secundario (CEM/ESRN)</option>
                <option value="tecnico">Técnico (CET)</option>
                <option value="superior">Superior</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Nombre Oficial de la Escuela
            </label>
            <input
              type="text"
              required
              placeholder="ej: Escuela Primaria N° 218 Barrio Rawson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Dirección
              </label>
              <input
                type="text"
                required
                placeholder="Calle y altura"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Barrio (Catriel)
              </label>
              <input
                type="text"
                placeholder="ej: Rawson / Preiss"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Directivo / Responsable
              </label>
              <input
                type="text"
                placeholder="Nombre del director"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Teléfono Institucional
              </label>
              <input
                type="text"
                placeholder="(0299) 491-..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-300 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Radio perimetral legal asignado automáticamente a <strong>200 metros</strong>.</span>
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
              Dar de Alta Escuela
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
