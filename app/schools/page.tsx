"use client";

import { useState } from "react";
import Link from "next/link";
import {
  School as SchoolIcon,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Cctv,
  Shield,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { MOCK_SCHOOLS, MOCK_CAMERAS } from "@/data/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { School } from "@/types/monitor";

export default function SchoolsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(MOCK_SCHOOLS[0]);

  const filteredSchools = MOCK_SCHOOLS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const schoolCameras = selectedSchool
    ? MOCK_CAMERAS.filter((c) => c.school_id === selectedSchool.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
              CRM EDUCATIVO MUNICIPAL
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Establecimientos Educativos
          </h1>
          <p className="text-xs text-slate-400">
            Escuelas públicas y privadas protegidas bajo el Corredor Escolar Cuidado de Catriel (Radio 200m)
          </p>
        </div>

        <button
          onClick={() => alert("Formulario de registro de nueva escuela en Catriel")}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Escuela</span>
        </button>
      </div>

      {/* Main Grid: List on Left, Detail Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: School List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código o calle..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#0c101a] py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filteredSchools.map((school) => {
              const isSelected = selectedSchool?.id === school.id;

              return (
                <div
                  key={school.id}
                  onClick={() => setSelectedSchool(school)}
                  className={`cursor-pointer rounded-xl border p-4.5 transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500/50 bg-[#121929] shadow-lg shadow-blue-600/10"
                      : "border-white/[0.08] bg-[#0c101a] hover:border-white/[0.16] hover:bg-[#0f1422]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                        <SchoolIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-sm">{school.name}</h3>
                          <span className="font-mono text-[10px] text-slate-400 rounded bg-white/[0.04] px-1.5 py-0.5 border border-white/[0.08]">
                            {school.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>{school.address}, {school.neighborhood} · {school.city}</span>
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={school.status} size="sm" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Cctv className="h-3.5 w-3.5 text-blue-400" />
                        <span className="font-mono font-medium text-slate-200">
                          {school.cameras_count} cámaras
                        </span>
                      </span>
                      <span className="hidden sm:inline font-mono text-[11px] text-emerald-400">
                        Radio {school.perimeter_radius_meters}m activo
                      </span>
                    </div>

                    <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
                      Ver Ficha
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed School Profile */}
        <div className="lg:col-span-1">
          {selectedSchool ? (
            <div className="sticky top-20 rounded-xl border border-white/[0.08] bg-[#0c101a] p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    FICHA INSTITUCIONAL
                  </span>
                  <StatusBadge status={selectedSchool.status} size="sm" />
                </div>
                <h2 className="mt-2 text-lg font-bold text-white">
                  {selectedSchool.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nivel: <span className="text-slate-200 uppercase font-mono">{selectedSchool.educational_level}</span>
                </p>
              </div>

              {/* Data attributes */}
              <div className="space-y-3 border-t border-white/[0.06] pt-4 text-xs">
                <div>
                  <p className="text-[11px] font-mono text-slate-500 uppercase">Dirección y Barrio</p>
                  <p className="text-slate-200 font-medium mt-0.5">{selectedSchool.address}</p>
                  <p className="text-slate-400 text-[11px]">{selectedSchool.neighborhood}, {selectedSchool.city}</p>
                </div>

                <div>
                  <p className="text-[11px] font-mono text-slate-500 uppercase">Responsable Institucional</p>
                  <p className="text-slate-200 font-medium mt-0.5">{selectedSchool.principal_name}</p>
                </div>

                <div>
                  <p className="text-[11px] font-mono text-slate-500 uppercase">Contacto Directo</p>
                  <p className="text-slate-200 font-mono mt-0.5">{selectedSchool.phone}</p>
                  <p className="text-slate-400 text-[11px]">{selectedSchool.email}</p>
                </div>

                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-300">Corredor Escolar Cuidado</span>
                    <span className="font-mono text-blue-400 font-bold">200 Metros</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cámaras perimetrales calibradas en el radio legal municipal.
                  </p>
                </div>
              </div>

              {/* Associated Cameras */}
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-white">
                    Cámaras Asociadas ({schoolCameras.length})
                  </h4>
                  <Link
                    href={`/monitor/live?school=${selectedSchool.id}`}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Ver en vivo
                  </Link>
                </div>

                <div className="space-y-2">
                  {schoolCameras.map((cam) => (
                    <div
                      key={cam.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#070a12] p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Cctv className="h-3.5 w-3.5 text-blue-400" />
                        <div>
                          <p className="font-medium text-slate-200">{cam.name}</p>
                          <p className="font-mono text-[9px] text-slate-500">{cam.identifier}</p>
                        </div>
                      </div>
                      <StatusBadge status={cam.status} size="sm" showDot={false} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-8 text-center text-slate-500">
              Seleccione una escuela para ver su ficha
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
