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
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection, saveDoc, logActivity } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import { StatusBadge } from "@/components/status-badge";
import { AddSchoolModal } from "@/components/add-school-modal";
import { School, Camera } from "@/types/monitor";

export default function SchoolsPage() {
  const { profile } = useAuth();
  const canEdit = can.editInfrastructure(profile?.role);
  const { data: schools, loading } = useCollection<School>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedSchool = schools.find((s) => s.id === selectedId) ?? schools[0] ?? null;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const schoolCameras = selectedSchool
    ? cameras.filter((c) => c.school_id === selectedSchool.id)
    : [];

  const handleAddSchool = (newSchool: School) => {
    saveDoc("schools", newSchool)
      .then(() => {
        setSelectedId(newSchool.id);
        return logActivity({
          event_type: "school_registered",
          title: "Escuela registrada",
          description: `${newSchool.code} · ${newSchool.name}`,
          entity_type: "school",
          entity_id: newSchool.id,
        });
      })
      .catch((err) => console.error("[schools]", err));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="adm-label">
              CRM EDUCATIVO MUNICIPAL
            </span>
            <span className="text-xs text-muted">· {schools.length} Establecimientos</span>
          </div>
          <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
            Establecimientos Educativos
          </h1>
          <p className="text-xs text-muted">
            Escuelas públicas y privadas protegidas bajo el Corredor Escolar Cuidado de Catriel (Radio 200m)
          </p>
        </div>

        <button
          disabled={!canEdit}
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-background hover:bg-[var(--accent-hover)] transition-colors"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código o calle..."
              className="w-full rounded-xl border border-[var(--line)] bg-panel py-2.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
            />
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filteredSchools.map((school) => {
              const isSelected = selectedSchool?.id === school.id;

              return (
                <div
                  key={school.id}
                  onClick={() => setSelectedId(school.id)}
                  className={`cursor-pointer rounded-xl border p-4.5 transition-all duration-200 ${
 isSelected
 ?"border-accent/50 bg-panel-2"
 :"border-[var(--line)] bg-panel hover:border-[var(--line-strong)] hover:bg-panel"
 }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft border border-accent/20 text-accent shrink-0">
                        <SchoolIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">{school.name}</h3>
                          <span className="font-mono text-[10px] text-muted rounded bg-white/[0.04] px-1.5 py-0.5 border border-[var(--line)]">
                            {school.code}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-muted shrink-0" />
                          <span>{school.address}, {school.neighborhood} · {school.city}</span>
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={school.status} size="sm" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-muted">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Cctv className="h-3.5 w-3.5 text-accent" />
                        <span className="font-mono font-medium text-foreground">
                          {cameras.filter((c) => c.school_id === school.id).length} cámaras
                        </span>
                      </span>
                      <span className="hidden sm:inline font-mono text-[11px] text-emerald-400">
                        Radio {school.perimeter_radius_meters}m activo
                      </span>
                    </div>

                    <span className="text-[11px] text-accent font-medium flex items-center gap-1">
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
            <div className="sticky top-20 rounded-xl border border-[var(--line)] bg-panel p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    FICHA INSTITUCIONAL
                  </span>
                  <StatusBadge status={selectedSchool.status} size="sm" />
                </div>
                <h2 className="mt-2 adm-title text-[13px] text-foreground">
                  {selectedSchool.name}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Nivel: <span className="text-foreground uppercase font-mono">{selectedSchool.educational_level}</span>
                </p>
              </div>

              {/* Data attributes */}
              <div className="space-y-3 border-t border-[var(--line)] pt-4 text-xs">
                <div>
                  <p className="text-[11px] font-mono text-muted uppercase">Dirección y Barrio</p>
                  <p className="text-foreground font-medium mt-0.5">{selectedSchool.address}</p>
                  <p className="text-muted text-[11px]">{selectedSchool.neighborhood}, {selectedSchool.city}</p>
                </div>

                <div>
                  <p className="text-[11px] font-mono text-muted uppercase">Responsable Institucional</p>
                  <p className="text-foreground font-medium mt-0.5">{selectedSchool.principal_name}</p>
                </div>

                <div>
                  <p className="text-[11px] font-mono text-muted uppercase">Contacto Directo</p>
                  <p className="text-foreground font-mono mt-0.5">{selectedSchool.phone}</p>
                  <p className="text-muted text-[11px]">{selectedSchool.email}</p>
                </div>

                <div className="rounded-lg border border-accent/20 bg-accent-soft p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-accent">Corredor Escolar Cuidado</span>
                    <span className="font-mono text-accent font-bold">200 Metros</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    Cámaras perimetrales calibradas en el radio legal municipal.
                  </p>
                </div>
              </div>

              {/* Associated Cameras */}
              <div className="border-t border-[var(--line)] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-foreground">
                    Cámaras Asociadas ({schoolCameras.length})
                  </h4>
                  <Link
                    href={`/monitor/live?school=${selectedSchool.id}`}
                    className="text-[11px] text-accent hover:text-accent font-medium"
                  >
                    Ver en vivo
                  </Link>
                </div>

                <div className="space-y-2">
                  {schoolCameras.map((cam) => (
                    <div
                      key={cam.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--well)] p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Cctv className="h-3.5 w-3.5 text-accent" />
                        <div>
                          <p className="font-medium text-foreground">{cam.name}</p>
                          <p className="font-mono text-[9px] text-muted">{cam.identifier}</p>
                        </div>
                      </div>
                      <StatusBadge status={cam.status} size="sm" showDot={false} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--line)] bg-panel p-8 text-center text-muted">
              Seleccione una escuela para ver su ficha
            </div>
          )}
        </div>
      </div>

      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSchool={handleAddSchool}
      />
    </div>
  );
}
