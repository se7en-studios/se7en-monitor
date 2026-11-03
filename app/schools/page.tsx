"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  School as SchoolIcon,
  Search,
  Plus,
  MapPin,
  Cctv,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection, saveDoc, logActivity } from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { AddSchoolModal } from "@/components/add-school-modal";
import { useToast } from "@/components/toast";
import {
  EmptyState,
  PageHeader,
  Skeleton,
  btnPrimary,
  searchInput,
} from "@/components/ui";
import { SchoolDetail } from "./school-detail";
import type { School, Camera } from "@/types/monitor";

// useSearchParams pide un Suspense alrededor para poder prerenderizar la página.
export default function SchoolsPage() {
  return (
    <Suspense>
      <SchoolsView />
    </Suspense>
  );
}

function SchoolsView() {
  const { profile } = useAuth();
  const toast = useToast();
  const canEdit = can.editInfrastructure(profile?.role);
  const { data: schools, loading } = useCollection<School>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const fromUrl = useSearchParams().get("school");
  const [searchTerm, setSearchTerm] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const selectedId = pickedId ?? fromUrl;
  const selectedSchool =
    schools.find((s) => s.id === selectedId) ?? schools[0] ?? null;
  const term = searchTerm.toLowerCase();
  const filteredSchools = schools.filter((s) =>
    [s.name, s.code, s.address].some((v) => v.toLowerCase().includes(term)),
  );
  const camerasOf = (id: string) => cameras.filter((c) => c.school_id === id);

  const select = (id: string) => {
    setPickedId(id);
    // En celular la ficha queda abajo de la lista: se baja hasta ella.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      );
    }
  };

  // Devuelve la promesa: si falla, el modal queda abierto y muestra el motivo.
  const handleAddSchool = async (newSchool: School) => {
    await saveDoc("schools", newSchool);
    setPickedId(newSchool.id);
    toast.success(`${newSchool.name} quedó registrada.`);
    void logActivity({
      event_type: "school_registered",
      title: "Escuela registrada",
      description: `${newSchool.code} · ${newSchool.name}`,
      entity_type: "school",
      entity_id: newSchool.id,
    });
  };

  const addButton = canEdit && (
    <button
      type="button"
      onClick={() => setIsAddModalOpen(true)}
      className={btnPrimary}
    >
      <Plus className="h-4 w-4" />
      Registrar escuela
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          loading ? "Escuelas" : `Escuelas · ${schools.length} registradas`
        }
        title="Establecimientos"
        accent="educativos"
        right={addButton}
      >
        Escuelas públicas y privadas protegidas por el Corredor Escolar Cuidado
        de Catriel, con su radio de 200 metros.
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-10 rounded-full" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[480px] rounded-xl" />
        </div>
      ) : schools.length === 0 ? (
        <div className="adm-in">
          <EmptyState
            icon={<SchoolIcon className="h-7 w-7" />}
            title="Todavía no hay escuelas"
            action={addButton || undefined}
          >
            {canEdit
              ? "Registrá la primera escuela para dibujar su corredor de 200 metros y asociarle cámaras."
              : "Cuando un administrador registre escuelas, aparecen acá."}
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="adm-in space-y-4 lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código o calle…"
                aria-label="Buscar escuelas"
                className={searchInput}
              />
            </div>

            {filteredSchools.length === 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="Sin resultados"
              >
                Ninguna escuela coincide con «{searchTerm}».
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {filteredSchools.map((school) => (
                  <li key={school.id}>
                    <SchoolRow
                      school={school}
                      cameraCount={camerasOf(school.id).length}
                      selected={selectedSchool?.id === school.id}
                      onSelect={() => select(school.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div ref={detailRef} className="adm-in scroll-mt-20 lg:col-span-1">
            {selectedSchool && (
              <SchoolDetail
                school={selectedSchool}
                cameras={camerasOf(selectedSchool.id)}
                canEdit={canEdit}
              />
            )}
          </div>
        </div>
      )}

      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSchool={handleAddSchool}
      />
    </div>
  );
}

interface SchoolRowProps {
  school: School;
  cameraCount: number;
  selected: boolean;
  onSelect: () => void;
}

function SchoolRow({
  school,
  cameraCount,
  selected,
  onSelect,
}: SchoolRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "focus-ring block w-full rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-accent/60 bg-panel-2"
          : "border-[var(--line)] bg-panel hover:border-[var(--line-strong)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
            <SchoolIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[15px] font-medium text-foreground">
                {school.name}
              </span>
              <span className="rounded-full border border-[var(--line)] px-2 py-px font-mono text-[10.5px] text-muted">
                {school.code}
              </span>
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {school.address}, {school.neighborhood} · {school.city}
              </span>
            </p>
          </div>
        </div>
        <span className="shrink-0">
          <StatusBadge status={school.status} size="sm" />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[12px] text-muted">
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Cctv className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-foreground">
              {cameraCount} {cameraCount === 1 ? "cámara" : "cámaras"}
            </span>
          </span>
          <span className="hidden font-mono sm:inline">
            Radio {school.perimeter_radius_meters} m
          </span>
        </span>
        <span className="flex items-center gap-1 font-medium text-accent">
          Ver ficha
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}
