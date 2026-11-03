"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  byNewest,
  currentActor,
  currentUid,
  logActivity,
  patchDoc,
  saveDoc,
  useCollection,
} from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import {
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_STATUS_LABELS,
  isOpenIncident,
} from "@/lib/incident-labels";
import type {
  Incident,
  IncidentPriority,
  IncidentStatus,
} from "@/types/monitor";
import { NewIncidentModal } from "@/components/new-incident-modal";
import { describeError, useToast } from "@/components/toast";
import {
  EmptyState,
  PageHeader,
  Skeleton,
  btnPrimary,
  input,
  searchInput,
} from "@/components/ui";
import { IncidentCard } from "./incident-card";
import { cn } from "@/lib/utils";

const sortIncidents = byNewest("reported_at");
const norm = (s: string | undefined) => (s ?? "").toLowerCase();

function matches(inc: Incident, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return [
    inc.code,
    inc.title,
    inc.school_name,
    inc.description,
    inc.assigned_to,
    inc.camera_name,
  ].some((v) => norm(v).includes(t));
}

/** Cambio de estado con quién y cuándo. Al resolver/cerrar se fija `resolved_at`; al reabrir se limpia. */
function statusPatch(
  inc: Incident,
  status: IncidentStatus,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const resolved_at = isOpenIncident(status) ? null : (inc.resolved_at ?? now);
  return { status, resolved_at, updated_at: now, updated_by: currentActor() };
}

export default function IncidentsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const canHandle = can.handleIncidents(profile?.role);
  const { data: incidents, loading } = useCollection<Incident>(
    "incidents",
    sortIncidents,
    { enabled: canHandle },
  );
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "open" | "all">("open");
  const [priority, setPriority] = useState<IncidentPriority | "all">("all");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = incidents.filter(
    (inc) =>
      matches(inc, term) &&
      (status === "all" ||
        (status === "open"
          ? isOpenIncident(inc.status)
          : inc.status === status)) &&
      (priority === "all" || inc.priority === priority),
  );

  const addIncident = async (inc: Incident) => {
    await saveDoc("incidents", { ...inc, reported_by: currentUid() });
    toast.success(`Incidente ${inc.code} reportado`);
    void logActivity({
      event_type: "incident_created",
      title: "Incidente reportado",
      description: `${inc.code} · ${inc.title}`,
      entity_type: "incident",
      entity_id: inc.id,
    });
  };

  const changeStatus = async (inc: Incident, next: IncidentStatus) => {
    setBusyId(inc.id);
    try {
      await patchDoc("incidents", inc.id, statusPatch(inc, next));
      toast.success(`${inc.code}: ${INCIDENT_STATUS_LABELS[next]}`);
      if (next === "resuelto")
        void logActivity({
          event_type: "incident_resolved",
          title: "Incidente resuelto",
          description: `${inc.code} · ${inc.title}`,
          entity_type: "incident",
          entity_id: inc.id,
        });
    } catch (err) {
      console.error("[incidentes] estado", err);
      toast.error(describeError(err, "No se pudo cambiar el estado."));
    } finally {
      setBusyId(null);
    }
  };

  const openCount = incidents.filter((i) => isOpenIncident(i.status)).length;

  if (!canHandle)
    return (
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6" />}
        title="Los incidentes los ven operadores y administración"
      >
        Pueden contener datos personales. Si necesitás verlos, pedile acceso a
        un Super Admin.
      </EmptyState>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${openCount} abiertos · ${incidents.length} en total`}
        title="Incidentes y"
        accent="novedades"
        right={
          canHandle && (
            <button className={btnPrimary} onClick={() => setIsNewOpen(true)}>
              <Plus className="h-4 w-4" /> Reportar incidente
            </button>
          )
        }
      >
        Lo que pasa en el corredor escolar: quién lo atiende y en qué estado
        está.
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por código, escuela, descripción o responsable…"
          aria-label="Buscar incidentes"
          className={cn(searchInput, "pl-3 md:max-w-md")}
        />
        <select
          aria-label="Filtrar por estado"
          className={cn(input, "w-auto rounded-full")}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="open">Abiertos</option>
          <option value="all">Todos los estados</option>
          {(Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatus[]).map(
            (s) => (
              <option key={s} value={s}>
                {INCIDENT_STATUS_LABELS[s]}
              </option>
            ),
          )}
        </select>
        <select
          aria-label="Filtrar por prioridad"
          className={cn(input, "w-auto rounded-full")}
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
        >
          <option value="all">Todas las prioridades</option>
          {(Object.keys(INCIDENT_PRIORITY_LABELS) as IncidentPriority[]).map(
            (p) => (
              <option key={p} value={p}>
                {INCIDENT_PRIORITY_LABELS[p]}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="space-y-3">
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" />}
            title={
              incidents.length
                ? "No hay incidentes con estos filtros"
                : "Todavía no hay incidentes"
            }
          >
            {incidents.length
              ? "Probá con otro estado o borrá la búsqueda."
              : "Cuando alguien reporte uno, aparece acá."}
          </EmptyState>
        )}
        {filtered.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            canHandle={canHandle}
            busy={busyId === inc.id}
            onChangeStatus={(s) => void changeStatus(inc, s)}
          />
        ))}
      </div>

      <NewIncidentModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onAddIncident={addIncident}
      />
    </div>
  );
}
