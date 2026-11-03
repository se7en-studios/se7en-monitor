"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/lib/firebase/auth-context";

const FullScreen = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#080b11] px-4 text-center text-slate-300">
    {children}
  </div>
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const isMobilePublisher = pathname.startsWith("/camera/publish");

  // El celular emisor entra por token, sin login.
  if (isMobilePublisher) {
    return (
      <main className="min-h-screen bg-[#070a12] text-white">{children}</main>
    );
  }

  if (loading) {
    return (
      <FullScreen>
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </FullScreen>
    );
  }

  if (!user) return <LoginScreen />;

  if (!profile || !profile.active) {
    return (
      <FullScreen>
        <p className="text-sm font-semibold text-white">
          Tu cuenta no tiene acceso habilitado.
        </p>
        <p className="text-xs text-slate-400">
          Pedile a un Super Admin que la active.
        </p>
        <button
          onClick={signOut}
          className="rounded-lg border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.04]"
        >
          Cerrar sesión
        </button>
      </FullScreen>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080b11] text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        <Topbar onOpenCommandMenu={() => setIsCommandOpen(true)} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
