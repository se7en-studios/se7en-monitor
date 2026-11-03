"use client";

import { useState, type FormEvent } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada.",
  "auth/too-many-requests":
    "Demasiados intentos. Probá de nuevo en unos minutos.",
  "auth/network-request-failed": "Sin conexión. Revisá tu red.",
};

function authMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  return AUTH_ERRORS[code] ?? "No se pudo iniciar sesión.";
}

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Anillos cruzados detrás del formulario, como en el ingreso del panel de Se7en. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[min(150vw,980px)] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 -rotate-[32deg] rounded-[50%] border border-[var(--line-strong)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[min(150vw,980px)] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] rounded-[50%] border border-accent/45"
      />
      <form
        onSubmit={onSubmit}
        className="adm-in relative w-full max-w-sm space-y-5 rounded-2xl border border-[var(--line)] bg-panel p-7"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Shield className="h-8 w-8 text-accent" />
          <h1 className="adm-display text-[28px] text-foreground">
            Se7en <span className="adm-serif">monitor</span>
          </h1>
          <p className="adm-label">Acceso para operadores autorizados</p>
        </div>

        <label className="block space-y-1.5">
          <span className="adm-label">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--well)] px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-accent/70 focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="adm-label">Contraseña</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--well)] px-3 py-2 text-[13px] text-foreground outline-none transition-colors focus:border-accent/70 focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-background hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Ingresar
        </button>
      </form>
    </div>
  );
}
