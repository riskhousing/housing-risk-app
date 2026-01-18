import type { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1220] text-white">
      {/* global background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-56 left-1/3 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_60%)]" />
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}
