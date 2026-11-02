"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobilePublisher = pathname.startsWith("/camera/publish");

  if (isMobilePublisher) {
    return <main className="min-h-screen bg-[#070a12] text-white">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[#080b11] text-slate-100">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

