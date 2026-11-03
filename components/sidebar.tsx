"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Cctv,
  School,
  MapPin,
  AlertTriangle,
  Bell,
  Wrench,
  FileBarChart,
  Users,
  Settings,
  Radio,
  ScrollText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection } from "@/lib/firebase/data";
import { can, ROLE_LABELS } from "@/lib/roles";
import type { Incident } from "@/types/monitor";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  live?: boolean;
  badge?: "incidents";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: "Operación",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      {
        name: "Monitoreo en vivo",
        href: "/monitor/live",
        icon: Video,
        live: true,
      },
      { name: "Cámaras", href: "/monitor/cameras", icon: Cctv },
      { name: "Escuelas", href: "/schools", icon: School },
      { name: "Mapa", href: "/map", icon: MapPin },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        name: "Incidentes",
        href: "/incidents",
        icon: AlertTriangle,
        badge: "incidents",
      },
      { name: "Alertas", href: "/alerts", icon: Bell },
      { name: "Mantenimiento", href: "/maintenance", icon: Wrench },
      { name: "Reportes", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Sistema",
    items: [
      { name: "Usuarios", href: "/users", icon: Users },
      { name: "Auditoría", href: "/audit", icon: ScrollText },
      { name: "Configuración", href: "/settings", icon: Settings },
    ],
  },
];

const CLOSED_STATES: Incident["status"][] = ["resuelto", "cerrado"];

// Colores fijos: la barra va siempre en tinta, como en el panel de Se7en.
const ROW =
  "focus-ring relative flex h-9 shrink-0 items-center rounded-full transition-colors duration-300";
const IDLE = "text-[#f2eee6]/55 hover:bg-[#f2eee6]/10 hover:text-[#f2eee6]";
const ON = "bg-[#f2eee6] font-medium text-[#0b0b0c]";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { data: incidents } = useCollection<Incident>("incidents");
  const openIncidents = incidents.filter(
    (i) => !CLOSED_STATES.includes(i.status),
  ).length;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        (i.href !== "/users" || can.manageUsers(profile?.role)) &&
        (i.href !== "/audit" || can.viewAudit(profile?.role)),
    ),
  })).filter((g) => g.items.length > 0);

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <aside
      className={cn(
        "fixed inset-y-3 left-3 z-40 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        open ? "w-[232px]" : "w-16",
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-[var(--rail)] px-3.5 py-4 ring-1 ring-[var(--rail-line)]">
        <Link
          href="/"
          aria-label="Inicio"
          className={cn(ROW, "mb-3 h-9 gap-2.5")}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[#0b0b0c]">
            <Radio className="h-[18px] w-[18px]" />
          </span>
          {open && (
            <span className="adm-fade adm-title truncate text-[15px] text-[#f2eee6]">
              Se7en <span className="adm-serif">monitor</span>
            </span>
          )}
        </Link>

        <nav
          aria-label="Secciones"
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden [scrollbar-width:none]"
        >
          {groups.map((group, gi) => (
            <div key={group.title} className="contents">
              {open ? (
                <p className="adm-fade mt-3 mb-0.5 truncate px-2.5 font-mono text-[10px] tracking-[0.13em] text-[#f2eee6]/35 uppercase">
                  {group.title}
                </p>
              ) : (
                gi > 0 && (
                  <span
                    aria-hidden
                    className="my-2 h-px w-full shrink-0 bg-[#f2eee6]/12"
                  />
                )
              )}
              {group.items.map((item) => {
                const on = isActive(item.href);
                const Icon = item.icon;
                const count = item.badge === "incidents" ? openIncidents : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.name}
                    aria-current={on ? "page" : undefined}
                    title={open ? undefined : item.name}
                    className={cn(
                      ROW,
                      open
                        ? "w-full gap-3 px-2.5 text-[13px]"
                        : "w-9 justify-center",
                      on ? ON : IDLE,
                    )}
                  >
                    <Icon size={17} className="shrink-0" />
                    {open && (
                      <span className="adm-fade truncate">{item.name}</span>
                    )}
                    {item.live && (
                      <span
                        aria-hidden
                        className={cn(
                          "h-2 w-2 rounded-full bg-emerald-400 animate-live-pulse",
                          open
                            ? "ml-auto"
                            : "absolute -top-0.5 -right-0.5 ring-2 ring-[var(--rail)]",
                        )}
                      />
                    )}
                    {count > 0 && (
                      <span
                        className={cn(
                          "min-w-4 rounded-full bg-accent px-1 text-center font-mono text-[10px] leading-4 font-medium text-[#0b0b0c]",
                          open
                            ? "ml-auto"
                            : "absolute -top-0.5 -right-0.5 ring-2 ring-[var(--rail)]",
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <span
          aria-hidden
          className="my-2 h-px w-full shrink-0 bg-[#f2eee6]/12"
        />

        <div
          className={cn(
            "flex items-center gap-2.5",
            open ? "px-0.5" : "justify-center",
          )}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2eee6]/12 font-mono text-[12px] font-medium text-[#f2eee6]"
            title={profile?.full_name}
          >
            {initials}
          </span>
          {open && (
            <span className="adm-fade min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium text-[#f2eee6]">
                {profile?.full_name}
              </span>
              <span className="block truncate text-[11px] text-[#f2eee6]/50">
                {profile ? ROLE_LABELS[profile.role] : ""}
              </span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={signOut}
          aria-label="Cerrar sesión"
          title={open ? undefined : "Cerrar sesión"}
          className={cn(
            ROW,
            "mt-2",
            open ? "w-full gap-3 px-2.5 text-[13px]" : "w-9 justify-center",
            IDLE,
          )}
        >
          <LogOut size={17} className="shrink-0" />
          {open && <span className="adm-fade">Cerrar sesión</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Achicar la barra" : "Abrir la barra"}
        className="focus-ring absolute top-[26px] -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rail)] text-[#f2eee6]/70 ring-1 ring-[var(--rail-line)] transition-colors hover:text-[#f2eee6]"
      >
        {open ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
      </button>
    </aside>
  );
}
