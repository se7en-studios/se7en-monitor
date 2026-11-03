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
  ShieldCheck,
  ChevronRight,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { can } from "@/lib/roles";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Monitoreo en vivo",
    href: "/monitor/live",
    icon: Video,
    badge: "LIVE",
  },
  {
    name: "Cámaras",
    href: "/monitor/cameras",
    icon: Cctv,
  },
  {
    name: "Escuelas",
    href: "/schools",
    icon: School,
  },
  {
    name: "Mapa de monitoreo",
    href: "/map",
    icon: MapPin,
    badge: "200m",
  },
  {
    name: "Incidentes",
    href: "/incidents",
    icon: AlertTriangle,
    badgeCount: 2,
  },
  {
    name: "Alertas",
    href: "/alerts",
    icon: Bell,
  },
  {
    name: "Mantenimiento",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    name: "Usuarios y permisos",
    href: "/users",
    icon: Users,
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const navItems = NAV_ITEMS.filter(
    (item) => item.href !== "/users" || can.manageUsers(profile?.role)
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.08] bg-[#070a12] text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold group-hover:scale-105 transition-transform">
            <Radio className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-wider text-white text-base">SE7EN</span>
              <span className="rounded bg-blue-500/10 px-1 py-0.2 text-[10px] font-mono font-medium text-blue-400 border border-blue-500/20">
                MONITOR
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 tracking-wider">
              CORREDOR ESCOLAR SEGURO
            </span>
          </div>
        </Link>
      </div>

      {/* Jurisdiction info */}
      <div className="mx-4 my-3 rounded-lg border border-white/[0.06] bg-[#0d121f] p-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-live-pulse" />
            Catriel, Río Negro
          </span>
          <span className="font-mono text-[10px] text-emerald-400">ONLINE</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500 leading-tight">
          Radio 200m · Ordenanza Favc
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600/15 text-white border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-blue-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span>{item.name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider",
                      item.badge === "LIVE"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                        : "bg-slate-800 text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                {typeof item.badgeCount === "number" && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 px-1 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                    {item.badgeCount}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3 w-3 text-blue-400" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Security & Studio Footer */}
      <div className="border-t border-white/[0.08] p-4 bg-[#05080e]">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <p className="font-medium text-slate-300">Privacidad y Protección</p>
            <p className="text-[10px] text-slate-500">Sin biométricos ni IA invasiva</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500">
          <span>Se7en Studio © 2026</span>
          <span className="font-mono text-[9px] text-slate-600">v1.0.0-PRO</span>
        </div>
      </div>
    </aside>
  );
}

