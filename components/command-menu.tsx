"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  School,
  Cctv,
  AlertTriangle,
  LayoutDashboard,
  Video,
  MapPin,
  Settings,
  X,
  ArrowRight,
} from "lucide-react";
import { useCollection } from "@/lib/firebase/data";
import type { Camera, Incident, School as SchoolDoc } from "@/types/monitor";

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: schools } = useCollection<SchoolDoc>("schools");
  const { data: cameras } = useCollection<Camera>("cameras");
  const { data: incidents } = useCollection<Incident>("incidents");

  // Listen to Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCameras = cameras.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.identifier.toLowerCase().includes(query.toLowerCase())
  );

  const filteredIncidents = incidents.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.code.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-[12vh] p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.14] bg-[#0c101a] shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5 bg-[#070a12]">
          <Search className="h-5 w-5 text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar escuelas, cámaras, incidentes o comandos (ej: 'CEM 21', 'CAM-204')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Quick Navigation Commands */}
          {!query && (
            <div>
              <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Navegación Rápida
              </p>
              <div className="mt-1 space-y-0.5">
                {[
                  { name: "Dashboard Central", icon: LayoutDashboard, href: "/" },
                  { name: "Monitoreo en Vivo (Grilla)", icon: Video, href: "/monitor/live" },
                  { name: "Mapa de Corredores 200m", icon: MapPin, href: "/map" },
                  { name: "Catálogo de Dispositivos", icon: Cctv, href: "/monitor/cameras" },
                  { name: "Configuración y Privacidad", icon: Settings, href: "/settings" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelect(item.href)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-blue-400" />
                        <span>{item.name}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schools Matches */}
          {filteredSchools.length > 0 && (
            <div>
              <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Establecimientos Educativos ({filteredSchools.length})
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredSchools.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(`/schools`)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <School className="h-4 w-4 text-cyan-400" />
                      <div>
                        <p className="font-semibold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{s.code} · {s.address}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">Radio 200m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cameras Matches */}
          {filteredCameras.length > 0 && (
            <div>
              <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Cámaras de Seguridad ({filteredCameras.length})
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredCameras.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(`/monitor/live?focus=${c.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cctv className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{c.identifier} · {c.school_name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents Matches */}
          {filteredIncidents.length > 0 && (
            <div>
              <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Incidentes y Novedades ({filteredIncidents.length})
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredIncidents.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => handleSelect(`/incidents`)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <div>
                        <p className="font-semibold text-white">{i.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{i.code} · {i.school_name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase">{i.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-white/[0.06] bg-[#070a12] px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              ESC
            </kbd>
            <span>para cerrar</span>
          </div>
          <span className="font-mono text-[10px]">SE7EN SPOTLIGHT</span>
        </div>
      </div>
    </div>
  );
}

