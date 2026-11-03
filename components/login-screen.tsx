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
    <div className="flex min-h-screen items-center justify-center bg-[#080b11] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-white/[0.08] bg-[#0c101a] p-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Shield className="h-8 w-8 text-blue-400" />
          <h1 className="text-lg font-bold text-white">SE7EN MONITOR</h1>
          <p className="text-xs text-slate-400">
            Acceso para operadores autorizados
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-300">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-slate-300">
            Contraseña
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#070a12] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60"
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Ingresar
        </button>
      </form>
    </div>
  );
}
