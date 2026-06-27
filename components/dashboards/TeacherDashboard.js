"use client";

import { useRouter } from "next/navigation";
import { Building2, Users, ClipboardList, CalendarCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTenantPath } from "@/lib/tenant";
import { useTeacherDashboard, useClasses } from "@/lib/api";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Badge from "@/components/shared/Badge";

export default function TeacherDashboard() {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const tpath = useTenantPath();
  const { stats, isLoading } = useTeacherDashboard();
  const { items: classes, isLoading: loadingClasses } = useClasses();

  return (
    <div>
      <PageHeader title={`Good day, ${user?.name?.split(" ").slice(-1)[0] || "there"}`} subtitle="Here's your teaching day at a glance." />
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My classes" value={isLoading ? "—" : stats?.classes ?? 0} delta={user?.form_class ? `form teacher of ${user.form_class}` : "assigned to me"} icon={Building2} tone="forest" />
        <StatCard label="My students" value={isLoading ? "—" : stats?.students ?? 0} delta="across my classes" icon={Users} tone="blue" />
        <StatCard label="Results in draft" value={isLoading ? "—" : stats?.results_pending ?? 0} delta="not yet submitted" icon={ClipboardList} tone="amber" />
        <StatCard label="Subject" value={user?.subject || "—"} delta="your specialism" icon={CalendarCheck} tone="gold" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>My classes</CardTitle></CardHeader>
          <CardBody className="p-2">
            {loadingClasses && <p className="px-3 py-4 text-sm text-ink/45">Loading…</p>}
            {!loadingClasses && classes.length === 0 && <p className="px-3 py-4 text-sm text-ink/45">No classes assigned yet.</p>}
            {classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-paper">
                <span className="text-sm"><b>{c.label}</b> &nbsp; <span className="text-ink/55">{c.students ?? 0} students</span></span>
                {c.form_teacher_id === user?.id ? <Badge tone="forest">Form teacher</Badge> : <Badge tone="gold">Subject</Badge>}
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardBody className="space-y-2.5">
            <Button className="w-full justify-center" onClick={() => router.push(tpath("/attendance"))}><CalendarCheck size={16} /> Take attendance</Button>
            <Button variant="outline" className="w-full justify-center" onClick={() => router.push(tpath("/results"))}><ClipboardList size={16} /> Enter results</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
