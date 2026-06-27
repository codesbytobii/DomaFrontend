"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCurrentTerm } from "@/lib/api";
import { logout } from "@/lib/auth";
import Avatar from "@/components/shared/Avatar";

const ROLE_LABEL = { super_admin: "Super Admin", school_admin: "School Admin", teacher: "Teacher", parent: "Parent" };

export default function Topbar() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const [menuOpen, setMenuOpen] = useState(false);

  // Term pill (tenant roles only — Super Admin has no tenant calendar).
  const term = useCurrentTerm(user?.role && user.role !== "super_admin");

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur sm:px-6">
      <button onClick={toggleSidebar} className="grid h-9 w-9 place-items-center rounded-lg text-ink/60 hover:bg-paper lg:hidden" aria-label="Open menu"><Menu size={20} /></button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
        <input placeholder="Search…" className="h-9 w-full rounded-lg border border-line bg-paper pl-9 pr-3 text-sm text-ink placeholder:text-ink/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-200" />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {user?.role !== "super_admin" && term && (
          <span className="hidden rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink/60 md:inline-flex">{term.name}</span>
        )}
        <button className="relative grid h-9 w-9 place-items-center rounded-lg text-ink/60 hover:bg-paper" aria-label="Notifications">
          <Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-400 ring-2 ring-white" />
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-paper">
            <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink">{user?.name}</span>
              <span className="block text-xs leading-tight text-ink/50">{ROLE_LABEL[user?.role]}</span>
            </span>
            <ChevronDown size={15} className="text-ink/40" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-pop">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-medium text-ink">{user?.name}</p>
                  <p className="truncate text-xs text-ink/50">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-line" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={15} /> Sign out</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
