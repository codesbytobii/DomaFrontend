"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import ParentOverview from "@/components/dashboards/ParentOverview";

/**
 * Dashboard is role-routed: each role gets a different home. Super Admin has a
 * separate platform console, so we bounce them there.
 */
export default function DashboardPage() {
  const role = useStore((s) => s.user?.role);
  const router = useRouter();

  useEffect(() => {
    if (role === "super_admin") router.replace("/platform");
  }, [role, router]);

  if (role === "teacher") return <TeacherDashboard />;
  if (role === "parent") return <ParentOverview />;
  if (role === "super_admin") return null; // redirecting
  return <AdminDashboard />;
}
