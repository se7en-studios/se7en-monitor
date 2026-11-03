import { Settings, Shield, Lock, EyeOff, Bell, Database } from "lucide-react";
import { SeedDemoCard } from "@/components/seed-demo-card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
          CONFIGURACIÓN GLOBAL DEL SISTEMA
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Ajustes y Parámetros de Seguridad
        </h1>
        <p className="text-xs text-slate-400">
          Políticas de privacidad escolar, retención de telemetría y conexión con Firebase
        </p>
      </div>

      <div className="space-y-4">
        {/* Privacy & Compliance Section */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3 text-white font-semibold text-sm">
            <EyeOff className="h-4 w-4 text-emerald-400" />
            <span>Directivas de Privacidad y Menores de Edad</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-[#070a12]">
              <div>
                <p className="font-medium text-white">Reconocimiento Facial Biométrico</p>
                <p className="text-slate-400 text-[11px]">Prohibido expresamente en entornos escolares</p>
              </div>
              <span className="font-mono text-rose-400 font-bold text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                DESACTIVADO (BLOQUEO PERMANENTE)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-[#070a12]">
              <div>
                <p className="font-medium text-white">Grabación Continua en la Nube</p>
                <p className="text-slate-400 text-[11px]">Solo transmisión en vivo para sala de monitoreo</p>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                OFF (CERO ALMACENAMIENTO DE VIDEO)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-[#070a12]">
              <div>
                <p className="font-medium text-white">Audio en Vivo</p>
                <p className="text-slate-400 text-[11px]">Silenciado por defecto en todas las pantallas</p>
              </div>
              <span className="font-mono text-blue-400 font-bold text-xs bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                MUTED POR DEFECTO
              </span>
            </div>
          </div>
        </div>

        {/* Backend Status */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c101a] p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3 text-white font-semibold text-sm">
            <Database className="h-4 w-4 text-blue-400" />
            <span>Infraestructura Backend y Señalización</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-white/[0.04] bg-[#070a12]">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Señalización WebRTC</span>
              <p className="text-slate-200 font-medium mt-1">Firebase Firestore (señalización por sesión)</p>
            </div>
            <div className="p-3 rounded-lg border border-white/[0.04] bg-[#070a12]">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Servidores STUN</span>
              <p className="text-slate-200 font-medium mt-1">Google Public STUN (19302)</p>
            </div>
          </div>
        </div>

        <SeedDemoCard />
      </div>
    </div>
  );
}

