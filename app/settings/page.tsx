import { Settings, Shield, Lock, EyeOff, Bell, Database } from "lucide-react";
import { SeedDemoCard } from "@/components/seed-demo-card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="adm-label">
          CONFIGURACIÓN GLOBAL DEL SISTEMA
        </span>
        <h1 className="mt-1 adm-display text-[clamp(28px,3.6vw,44px)] text-foreground">
          Ajustes y Parámetros de Seguridad
        </h1>
        <p className="text-xs text-muted">
          Políticas de privacidad escolar, retención de telemetría y conexión con Firebase
        </p>
      </div>

      <div className="space-y-4">
        {/* Privacy & Compliance Section */}
        <div className="rounded-xl border border-[var(--line)] bg-panel p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] pb-3 text-foreground font-semibold text-sm">
            <EyeOff className="h-4 w-4 text-emerald-400" />
            <span>Directivas de Privacidad y Menores de Edad</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--line)] bg-[var(--well)]">
              <div>
                <p className="font-medium text-foreground">Reconocimiento Facial Biométrico</p>
                <p className="text-muted text-[11px]">Prohibido expresamente en entornos escolares</p>
              </div>
              <span className="font-mono text-rose-400 font-bold text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                DESACTIVADO (BLOQUEO PERMANENTE)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--line)] bg-[var(--well)]">
              <div>
                <p className="font-medium text-foreground">Grabación Continua en la Nube</p>
                <p className="text-muted text-[11px]">Solo transmisión en vivo para sala de monitoreo</p>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                OFF (CERO ALMACENAMIENTO DE VIDEO)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--line)] bg-[var(--well)]">
              <div>
                <p className="font-medium text-foreground">Audio en Vivo</p>
                <p className="text-muted text-[11px]">Silenciado por defecto en todas las pantallas</p>
              </div>
              <span className="font-mono text-accent font-bold text-xs bg-accent-soft border border-accent/20 px-2 py-0.5 rounded">
                MUTED POR DEFECTO
              </span>
            </div>
          </div>
        </div>

        {/* Backend Status */}
        <div className="rounded-xl border border-[var(--line)] bg-panel p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] pb-3 text-foreground font-semibold text-sm">
            <Database className="h-4 w-4 text-accent" />
            <span>Infraestructura Backend y Señalización</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--well)]">
              <span className="text-[10px] font-mono text-muted uppercase">Señalización WebRTC</span>
              <p className="text-foreground font-medium mt-1">Firebase Firestore (señalización por sesión)</p>
            </div>
            <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--well)]">
              <span className="text-[10px] font-mono text-muted uppercase">Servidores STUN</span>
              <p className="text-foreground font-medium mt-1">Google Public STUN (19302)</p>
            </div>
          </div>
        </div>

        <SeedDemoCard />
      </div>
    </div>
  );
}

