"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, Wallet, CalendarCheck, CalendarDays,
  MessageSquare, Settings, GraduationCap, BookOpen, Briefcase, X, Building2,
  UserPlus, CreditCard, LayoutTemplate, ArrowUpNarrowWide, Contact, Megaphone,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useTenantSlug } from "@/lib/tenant";
import { cn } from "@/lib/utils";

/**
 * NAV items use `group` (string-only entry) as a section header.
 * `locked` items are future modules shown as coming soon.
 */
const NAV = {
  super_admin: [
    { group: "Platform" },
    { href: "/platform", label: "Overview", icon: LayoutDashboard },
    { group: "Schools" },
    { href: "/platform/schools", label: "Schools", icon: Building2 },
    { href: "/platform/onboarding", label: "Onboard school", icon: UserPlus },
    { href: "/platform/subscriptions", label: "Subscriptions", icon: CreditCard },
    { group: "Content" },
    { href: "/platform/templates", label: "Templates", icon: LayoutTemplate },
  ],
  school_admin: [
    { group: "Overview" },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { group: "Academics" },
    { href: "/students", label: "Students", icon: Users },
    { href: "/classes", label: "Classes & arms", icon: Building2 },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/results", label: "Results", icon: ClipboardList },
    { href: "/promotions", label: "Promotions", icon: ArrowUpNarrowWide },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/timetable", label: "Timetable", icon: CalendarDays, locked: true },
    { group: "Finance" },
    { href: "/fees", label: "Fees", icon: Wallet },
    { group: "Communication" },
    { href: "/communication", label: "Communication", icon: MessageSquare },
    { group: "People" },
    { href: "/staff", label: "Staff", icon: Contact },
    { group: "School" },
    { href: "/settings", label: "Settings", icon: Settings },
    { group: "Coming soon" },
    { href: "/payroll", label: "HR & Payroll", icon: Briefcase, locked: true },
    { href: "/lms", label: "LMS", icon: GraduationCap, locked: true },
    { href: "/library", label: "Library", icon: BookOpen, locked: true },
  ],
  teacher: [
    { group: "Overview" },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { group: "Teaching" },
    { href: "/classes", label: "My classes", icon: Building2 },
    { href: "/results", label: "Results", icon: ClipboardList },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/timetable", label: "Timetable", icon: CalendarDays, locked: true },
  ],
  parent: [
    { group: "My children" },
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/results", label: "Result sheet", icon: ClipboardList },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/fees", label: "Fees", icon: Wallet },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const role = useStore((s) => s.user?.role) || "school_admin";
  const school = useStore((s) => s.school);
  const logoUrl = useStore((s) => s.logoUrl);
  const brandColor = useStore((s) => s.brandColor) || "#1B6B3A";
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  const items = NAV[role] || NAV.school_admin;
  const slug = useTenantSlug();
  const isSuper = role === "super_admin";
  const toHref = (page) => (isSuper ? page : `/${slug}${page}`);
  const home = isSuper ? "/platform" : `/${slug}/dashboard`;

  const schoolName = school?.name || "Sembly";
  const planLabel = school?.plan ? `${school.plan} plan` : "";
  const roleLabel = { school_admin: planLabel, teacher: "Teacher", parent: "Parent portal", super_admin: "Super Admin" }[role] || "";

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: brandColor }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link href={home} className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            {logoUrl
              ? <img src={logoUrl} alt="School logo" className="h-9 w-9 rounded-lg object-contain bg-white/15 p-0.5" />
              : <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 font-display text-lg font-bold text-white">{schoolName[0]}</span>
            }
            <span className="font-display text-xl tracking-tight text-white">Sembly</span>
          </Link>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setSidebarOpen(false)} aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* School context pill */}
        <div className="mx-3 mb-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.15)" }}>
          <p className="truncate text-sm font-medium text-white">{isSuper ? "Platform console" : schoolName}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{roleLabel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {items.map((item, idx) => {
            // Section header
            if ("group" in item && !item.href) {
              return (
                <p key={`group-${idx}`} className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.45)" }}>
                  {item.group}
                </p>
              );
            }
            const { href, label, icon: Icon, locked } = item;
            const fullHref = toHref(href);
            const active = href === "/platform"
              ? pathname === "/platform"
              : pathname === fullHref || pathname?.startsWith(fullHref + "/");
            return (
              <Link
                key={href}
                href={fullHref}
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                style={{
                  background: active ? "rgba(255,255,255,0.15)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.72)",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {locked && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          v1.0 · {new Date().getFullYear()} Sembly
        </div>
      </aside>
    </>
  );
}
