import { EyeOff, Database } from "lucide-react";
import { SeedDemoCard } from "@/components/seed-demo-card";
import { PolicyCard } from "@/components/policy-card";
import { Card, PageHeader } from "@/components/ui";

const PRIVACY = [
  {
    title: "Reconocimiento facial biométrico",
    note: "Prohibido expresamente en entornos escolares",
    state: "Desactivado · bloqueo permanente",
    tone: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  },
  {
    title: "Grabación continua en la nube",
    note: "Solo transmisión en vivo para la sala de monitoreo",
    state: "Apagada · sin almacenar video",
    tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  {
    title: "Audio en vivo",
    note: "Silenciado por defecto en todas las pantallas",
    state: "Silenciado por defecto",
    tone: "border-accent/25 bg-accent-soft text-accent",
  },
];

const BACKEND = [
  {
    label: "Señalización WebRTC",
    value: "Firebase Firestore (señalización por sesión)",
  },
  { label: "Servidores STUN", value: "Google Public STUN (19302)" },
];

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Configuración del sistema"
        title="Ajustes y"
        accent="privacidad"
      >
        Políticas de privacidad escolar, marco operativo y conexión con
        Firebase.
      </PageHeader>

      <Card
        title="Privacidad y menores de edad"
        icon={<EyeOff className="h-4 w-4" />}
      >
        <ul className="space-y-2 p-4">
          {PRIVACY.map((p) => (
            <li
              key={p.title}
              className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--well)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {p.title}
                </p>
                <p className="text-[12px] text-muted">{p.note}</p>
              </div>
              <span
                className={`self-start rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase sm:self-auto ${p.tone}`}
              >
                {p.state}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Infraestructura y señalización"
        icon={<Database className="h-4 w-4" />}
      >
        <dl className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {BACKEND.map((b) => (
            <div
              key={b.label}
              className="rounded-lg border border-[var(--line)] bg-[var(--well)] p-3"
            >
              <dt className="adm-label">{b.label}</dt>
              <dd className="mt-1 text-[13px] text-foreground">{b.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <PolicyCard />
      <SeedDemoCard />
    </div>
  );
}
