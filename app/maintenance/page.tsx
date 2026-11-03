"use client";

import { useState } from "react";
import { CalendarDays, Plus, User, Wrench } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  byNewest,
  currentActor,
  patchDoc,
  useCollection,
} from "@/lib/firebase/data";
import { can } from "@/lib/roles";
import type { Camera, MaintenanceTicket } from "@/types/monitor";
import { describeError, useToast } from "@/components/toast";
import {
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  btnPrimary,
  searchInput,
} from "@/components/ui";
import { cn, formatTimeAgo } from "@/lib/utils";
import { NewTicketModal } from "./new-ticket-modal";

type Status = MaintenanceTicket["status"];
const sortTickets = byNewest("created_at");
const STATUS_LABEL: Record<Status, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completado: "Completado",
};
const STATUSES = Object.keys(STATUS_LABEL) as Status[];
const FILTERS = [
  { id: "open", label: "Abiertas" },
  { id: "completado", label: "Completadas" },
  { id: "all", label: "Todas" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

export default function MaintenancePage() {
  const { profile } = useAuth();
  const toast = useToast();
  const canHandle = can.handleMaintenance(profile?.role);
  const { data: tickets, loading } = useCollection<MaintenanceTicket>(
    "maintenance_tickets",
    sortTickets,
  );
  const { data: cameras } = useCollection<Camera>("cameras");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [term, setTerm] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const t = term.trim().toLowerCase();
  const filtered = tickets.filter(
    (k) =>
      (filter === "all" ||
        (filter === "open"
          ? k.status !== "completado"
          : k.status === filter)) &&
      (!t ||
        [k.code, k.title, k.school_name, k.camera_name, k.technician].some(
          (v) => (v ?? "").toLowerCase().includes(t),
        )),
  );

  const changeStatus = async (ticket: MaintenanceTicket, status: Status) => {
    setBusyId(ticket.id);
    try {
      await patchDoc("maintenance_tickets", ticket.id, {
        status,
        updated_at: new Date().toISOString(),
        updated_by: currentActor(),
      });
      toast.success(`${ticket.code}: ${STATUS_LABEL[status]}`);
    } catch (err) {
      console.error("[mantenimiento] estado", err);
      toast.error(describeError(err, "No se pudo cambiar el estado."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Soporte de infraestructura"
        title="Mantenimiento"
        accent="de cámaras"
        right={
          canHandle && (
            <button
              className={btnPrimary}
              disabled={cameras.length === 0}
              onClick={() => setIsModalOpen(true)}
              title={
                cameras.length === 0
                  ? "Primero hay que dar de alta una cámara"
                  : undefined
              }
            >
              <Plus className="h-4 w-4" /> Nueva orden
            </button>
          )
        }
      >
        Reparaciones y revisiones de las cámaras del corredor escolar.
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented
          label="Estado de las órdenes"
          value={filter}
          onChange={setFilter}
          options={FILTERS}
        />
        <input
          type="search"
          aria-label="Buscar órdenes"
          placeholder="Buscar por código, cámara, escuela o técnico…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className={cn(searchInput, "pl-3 md:max-w-md")}
        />
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title={
            tickets.length
              ? "No hay órdenes con estos filtros"
              : "Todavía no hay órdenes de trabajo"
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {loading && [0, 1].map((i) => <Skeleton key={i} className="h-44" />)}
          {filtered.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              canHandle={canHandle}
              busy={busyId === ticket.id}
              onChange={(s) => void changeStatus(ticket, s)}
            />
          ))}
        </div>
      )}
      {isModalOpen && (
        <NewTicketModal
          cameras={cameras}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function TicketCard({
  ticket,
  canHandle,
  busy,
  onChange,
}: {
  ticket: MaintenanceTicket;
  canHandle: boolean;
  busy: boolean;
  onChange: (s: Status) => void;
}) {
  return (
    <article className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold text-accent">
          {ticket.code}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10.5px] uppercase",
            ticket.priority === "urgente"
              ? "border-red-500/30 text-red-400"
              : "border-[var(--line-strong)] text-muted",
          )}
        >
          {ticket.priority === "urgente" ? "Urgente" : "Normal"}
        </span>
      </div>
      <div>
        <h3 className="adm-title text-[15px] text-foreground">
          {ticket.title}
        </h3>
        <p className="mt-1 text-[12px] text-muted">
          {ticket.school_name} · {ticket.camera_name}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> {ticket.technician}
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <CalendarDays className="h-3.5 w-3.5" /> {ticket.scheduled_for}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
        <span className="text-[12px] text-muted">
          {ticket.updated_at
            ? `Último cambio ${formatTimeAgo(ticket.updated_at)}${ticket.updated_by ? ` por ${ticket.updated_by}` : ""}`
            : ""}
        </span>
        <select
          aria-label={`Estado de ${ticket.code}`}
          value={ticket.status}
          disabled={!canHandle || busy}
          onChange={(e) => onChange(e.target.value as Status)}
          className="focus-ring rounded-full border border-[var(--line-strong)] bg-[var(--well)] px-2.5 py-1 text-[12px] text-foreground disabled:opacity-60"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
