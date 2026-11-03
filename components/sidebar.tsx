"use client";

// La barra de navegación. En la compu (lg+) flota al costado y se achica a
// íconos (Sidebar); en celular y tablet es un cajón que entra desde la izquierda
// (NavDrawer). Las dos muestran lo mismo (RailNav). Va siempre en tinta.
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
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCollection } from "@/lib/firebase/data";
import { can, ROLE_LABELS, type Role } from "@/lib/roles";
import type { Incident } from "@/types/monitor";

export interface NavItem {
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
      { name: "Informes", href: "/reports", icon: FileBarChart },
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

/** Las secciones que el rol puede ver (Usuarios y Auditoría tienen permiso propio). */
export function navFor(role?: Role): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        (i.href !== "/users" || can.manageUsers(role)) &&
        (i.href !== "/audit" || can.viewAudit(role)) &&
        (i.href !== "/incidents" || can.handleIncidents(role)) &&
        (i.href !== "/monitor/live" || can.watchLive(role)),
    ),
  })).filter((g) => g.items.length > 0);
}

const CLOSED_STATES: Incident["status"][] = ["resuelto", "cerrado"];

const ROW =
  "focus-ring relative flex h-9 shrink-0 items-center rounded-full transition-colors duration-300";
const IDLE = "text-foreground/60 hover:bg-foreground/10 hover:text-foreground";
const ON = "bg-foreground font-medium text-background";
const RULE = (
  <span aria-hidden className="my-2 h-px w-full shrink-0 bg-foreground/12" />
);

/** Logo, secciones, quién está y salir. `expanded`: con nombres; si no, solo íconos. */
function RailNav({ expanded }: { expanded: boolean }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { data: incidents } = useCollection<Incident>("incidents", undefined, {
    enabled: can.handleIncidents(profile?.role),
  });
  const openIncidents = incidents.filter(
    (i) => !CLOSED_STATES.includes(i.status),
  ).length;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const row = expanded
    ? "w-full gap-3 px-2.5 text-[13px]"
    : "w-9 justify-center";
  const corner = expanded
    ? "ml-auto"
    : "absolute -top-0.5 -right-0.5 ring-2 ring-[var(--rail)]";

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <>
      <Link href="/" aria-label="Inicio" className={cn(ROW, "mb-3 gap-2.5")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-background">
          <Radio className="h-[18px] w-[18px]" />
        </span>
        {expanded && (
          <span className="adm-fade adm-title truncate text-[15px] text-foreground">
            Se7en <span className="adm-serif">monitor</span>
          </span>
        )}
      </Link>

      <nav
        aria-label="Secciones"
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto [scrollbar-width:none]"
      >
        {navFor(profile?.role).map((group, gi) => (
          <div key={group.title} className="contents">
            {expanded ? (
              <p className="adm-fade mt-3 mb-0.5 truncate px-2.5 font-mono text-[10px] tracking-[0.13em] text-foreground/50 uppercase">
                {group.title}
              </p>
            ) : (
              gi > 0 && RULE
            )}
            {group.items.map((item) => {
              const on = isActive(item.href);
              const Icon = item.icon;
              const count = item.badge === "incidents" ? openIncidents : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={
                    count ? `${item.name} (${count} abiertos)` : item.name
                  }
                  aria-current={on ? "page" : undefined}
                  title={expanded ? undefined : item.name}
                  className={cn(ROW, row, on ? ON : IDLE)}
                >
                  <Icon size={17} className="shrink-0" />
                  {expanded && (
                    <span className="adm-fade truncate">{item.name}</span>
                  )}
                  {item.live && (
                    <span
                      aria-hidden
                      className={cn(
                        "animate-live-pulse h-2 w-2 rounded-full bg-emerald-400",
                        corner,
                      )}
                    />
                  )}
                  {count > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        "min-w-4 rounded-full bg-accent px-1 text-center font-mono text-[10px] leading-4 font-medium text-background",
                        corner,
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

      {RULE}

      <div
        className={cn(
          "flex items-center gap-2.5",
          expanded ? "px-0.5" : "justify-center",
        )}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/12 font-mono text-[12px] font-medium text-foreground"
          title={profile?.full_name}
          aria-hidden
        >
          {initials}
        </span>
        {expanded && (
          <span className="adm-fade min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-foreground">
              {profile?.full_name}
            </span>
            <span className="block truncate text-[11px] text-foreground/60">
              {profile ? ROLE_LABELS[profile.role] : ""}
            </span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={signOut}
        aria-label="Cerrar sesión"
        title={expanded ? undefined : "Cerrar sesión"}
        className={cn(ROW, "mt-2", row, IDLE)}
      >
        <LogOut size={17} className="shrink-0" />
        {expanded && <span className="adm-fade">Cerrar sesión</span>}
      </button>
    </>
  );
}

const RAIL_BOX =
  "flex h-full flex-col overflow-hidden bg-[var(--rail)] px-3.5 py-4 ring-1 ring-[var(--rail-line)]";

/** Compu: la pastilla flotante, abierta (con nombres) o angosta (íconos). */
export function Sidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-3 left-3 z-40 hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
        open ? "w-[232px]" : "w-16",
      )}
    >
      <div className={cn(RAIL_BOX, "rounded-[2rem]")}>
        <RailNav expanded={open} />
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Achicar la barra" : "Abrir la barra"}
        title={open ? "Achicar la barra" : "Abrir la barra"}
        className="focus-ring absolute top-[26px] -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rail)] text-foreground/70 ring-1 ring-[var(--rail-line)] transition-colors hover:text-foreground"
      >
        {open ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
      </button>
    </aside>
  );
}

/** Celular y tablet: cajón con fondo oscuro. Se cierra al tocar un enlace, el fondo o la X. */
export function NavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar menú"
        onClick={onClose}
        className="adm-fade absolute inset-0 cursor-default bg-background/80 backdrop-blur-sm"
      />
      <aside
        onClickCapture={(e) =>
          (e.target as HTMLElement).closest("a") && onClose()
        }
        className={cn(
          RAIL_BOX,
          "adm-drawer absolute inset-y-0 left-0 w-[min(280px,85vw)] rounded-r-[2rem]",
        )}
      >
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Cerrar menú"
          className="focus-ring absolute top-4 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X size={17} />
        </button>
        <RailNav expanded />
      </aside>
    </div>
  );
}
