"use client";

// Paleta de comandos (Ctrl/⌘ K), con el criterio de la de Se7en: agrupada,
// se maneja con flechas y Enter, la fila activa se invierte (papel sobre tinta)
// y el foco queda atrapado en el buscador mientras está abierta.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Cctv,
  CornerDownLeft,
  School,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection } from "@/lib/firebase/data";
import { cn } from "@/lib/utils";
import { navFor } from "@/components/sidebar";
import { Kbd } from "@/components/ui";
import type { Camera, Incident, School as SchoolDoc } from "@/types/monitor";

interface CommandItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  href: string;
}

const PER_GROUP = 6;
const CAMERA_STATUS: Record<Camera["status"], string> = {
  online: "En línea",
  offline: "Sin señal",
  alerta: "Alerta",
  mantenimiento: "Mantenimiento",
};

/** Minúsculas y sin tildes: «cámara» encuentra «camara». */
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CommandMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return open ? <Palette onClose={onClose} /> : null;
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: schools, loading: l1 } = useCollection<SchoolDoc>("schools");
  const { data: cameras, loading: l2 } = useCollection<Camera>("cameras");
  const { data: incidents, loading: l3 } = useCollection<Incident>("incidents");
  const loading = l1 || l2 || l3;
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  // Al cerrar, el foco vuelve a donde estaba (el botón de buscar, por ejemplo).
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus?.();
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    const words = norm(q.trim()).split(/\s+/).filter(Boolean);
    const match = (text: string) => words.every((w) => norm(text).includes(w));
    const pick = (all: CommandItem[]) =>
      all
        .filter((i) => match(`${i.label} ${i.hint ?? ""}`))
        .slice(0, PER_GROUP);

    const sections: CommandItem[] = navFor(profile?.role).flatMap((g) =>
      g.items.map((it) => {
        const Icon = it.icon;
        return {
          id: `n-${it.href}`,
          group: "Secciones",
          label: it.name,
          hint: g.title,
          icon: <Icon size={16} />,
          href: it.href,
        };
      }),
    );
    if (!words.length) return sections;

    const schoolItems = schools.map((s) => ({
      id: `s-${s.id}`,
      group: "Escuelas",
      label: s.name,
      hint: `${s.code} · ${s.address}`,
      icon: <School size={16} />,
      href: `/schools?school=${encodeURIComponent(s.id)}`,
    }));
    const cameraItems = cameras.map((c) => ({
      id: `c-${c.id}`,
      group: "Cámaras",
      label: c.name,
      hint: `${c.identifier} · ${CAMERA_STATUS[c.status] ?? c.status}`,
      icon: <Cctv size={16} />,
      href: `/monitor/live?focus=${encodeURIComponent(c.id)}`,
    }));
    const incidentItems = incidents.map((i) => ({
      id: `i-${i.id}`,
      group: "Incidentes",
      label: i.title,
      hint: `${i.code} · ${i.school_name}`,
      icon: <AlertTriangle size={16} />,
      href: "/incidents",
    }));
    return [
      ...pick(schoolItems),
      ...pick(cameraItems),
      ...pick(incidentItems),
      ...pick(sections),
    ];
  }, [q, schools, cameras, incidents, profile?.role]);

  useEffect(() => {
    list.current
      ?.querySelector(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: CommandItem | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Tab") {
      // ponytail: el buscador es lo único enfocable; las filas se recorren con flechas.
      e.preventDefault();
    }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 pt-[10vh] sm:p-4 sm:pt-[12vh]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar la búsqueda"
        onClick={onClose}
        className="adm-fade absolute inset-0 cursor-default bg-background/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar o saltar a una sección"
        className="adm-fade relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-panel"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4">
          <Search size={16} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar escuelas, cámaras, incidentes o secciones…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={
              items[active] ? `cmd-${items[active].id}` : undefined
            }
            className="h-12 min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted/70 focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>

        <ul
          id="command-list"
          ref={list}
          role="listbox"
          className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
        >
          {items.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-muted">
              {loading
                ? "Buscando en la red de escuelas…"
                : "Nada coincide con la búsqueda."}
            </li>
          )}
          {items.map((item, i) => {
            const head = item.group !== lastGroup;
            lastGroup = item.group;
            const on = i === active;
            return (
              <li key={item.id} role="presentation">
                {head && (
                  <p className="adm-label px-2.5 pt-3 pb-1">{item.group}</p>
                )}
                <button
                  type="button"
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={on}
                  tabIndex={-1}
                  data-i={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] transition-colors",
                    on
                      ? "bg-foreground font-medium text-background"
                      : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      on ? "text-background" : "text-muted",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && (
                    <span
                      className={cn(
                        "hidden max-w-[45%] shrink-0 truncate font-mono text-[11px] sm:block",
                        on ? "text-background/75" : "text-muted",
                      )}
                    >
                      {item.hint}
                    </span>
                  )}
                  {on && (
                    <CornerDownLeft
                      size={14}
                      className="shrink-0 text-background/75"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--well)] px-4 py-2.5 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> moverse
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> abrir
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>Esc</Kbd> cerrar
            </span>
          </div>
          <span className="hidden sm:inline">
            <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> desde cualquier pantalla
          </span>
        </div>
      </div>
    </div>
  );
}
