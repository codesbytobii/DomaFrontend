"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { bootstrapSession, isAuthenticated } from "@/lib/auth";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }) {
  const user = useStore((s) => s.user);
  const brandColor = useStore((s) => s.brandColor);
  const accentColor = useStore((s) => s.accentColor);
  const router = useRouter();
  const [checking, setChecking] = useState(!user);

  // Apply school brand colors as CSS variables across the whole app
  useEffect(() => {
    if (brandColor) document.documentElement.style.setProperty("--brand-color", brandColor);
    if (accentColor) document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [brandColor, accentColor]);

  useEffect(() => {
    let active = true;
    if (user) { setChecking(false); return; }
    if (!isAuthenticated()) { router.replace("/login"); return; }
    bootstrapSession()
      .then((u) => { if (!active) return; if (!u) router.replace("/login"); else setChecking(false); })
      .catch(() => active && router.replace("/login"));
    return () => { active = false; };
  }, [user, router]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <div className="flex items-center gap-3 text-ink/50">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
