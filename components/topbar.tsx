"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Smartphone,
  Shield,
  Clock,
  Sparkles,
  LogOut,
} from "lucide-react";
import { ConnectMobileModal } from "./connect-mobile-modal";
import { useAuth } from "@/lib/firebase/auth-context";
import { ROLE_LABELS } from "@/lib/roles";

interface TopbarProps {
  onOpenCommandMenu?: () => void;
}

export function Topbar({ onOpenCommandMenu }: TopbarProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [time, setTime] = useState("");
  const { profile, signOut } = useAuth();
  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#070a12]/90 px-6 backdrop-blur-md">
        {/* Search bar with Ctrl+K shortcut */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <button
            onClick={onOpenCommandMenu}
            className="group relative flex w-full items-center justify-between rounded-full border border-white/[0.08] bg-[#0d121f] py-1.5 pl-9 pr-3 text-xs text-slate-400 hover:border-blue-500/40 hover:text-slate-200 transition-colors"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-hover:text-blue-400" />
            <span className="truncate">Buscar escuelas, cámaras por ID o incidentes...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Center / Jurisdiction badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-semibold text-blue-300">Centro de Monitoreo Urbano</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Municipio de Catriel</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-400 border border-white/[0.06] bg-[#0d121f] px-3 py-1.5 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{time || "--:--:--"}</span>
          </div>

          {/* Quick Connect Mobile Button */}
          <button
            onClick={() => setIsConnectOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Conectar Celular</span>
          </button>

          {/* Demo Data Pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono text-amber-400">
            <Sparkles className="h-3 w-3" />
            <span>DEMO V1</span>
          </div>

          {/* User profile menu */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-xs text-white shadow-inner">
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-semibold text-white">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400">{profile ? ROLE_LABELS[profile.role] : ""}</p>
            </div>
            <button onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión" className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <ConnectMobileModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </>
  );
}
