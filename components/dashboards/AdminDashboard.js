"use client";

import { Users, Wallet, CalendarCheck, ClipboardList, FileText, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTenantPath } from "@/lib/tenant";
import { useAdminDashboard } from "@/lib/api";
import { formatNaira, percent } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";

export default function AdminDashboard() {
  const user = useStore((s) => s.user);
  const school = useStore((s) => s.school);
  const router = useRouter();
  const tpath = useTenantPath();
  const { stats, isLoading } = useAdminDashboard();

  const collected = stats?.fees_collected ?? 0;
  const expected = stats?.fees_expected ?? 0;
  const collectedPct = percent(collected, expected);

  return (
    <div>
      <PageHeader title={`Good day, ${user?.name?.split(" ")[0] || "there"}`} subtitle={`Here's how ${school?.name || "your school"} is doing this term.`}>
        <Button variant="outline" size="md" onClick={() => router.push(tpath("/results"))}><FileText size={16} /> Results</Button>
        <Button size="md" onClick={() => router.push(tpath("/communication"))}><Send size={16} /> Send announcement</Button>
      </PageHeader>

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={isLoading ? "—" : stats?.students ?? 0} delta="active this session" icon={Users} tone="forest" />
        <StatCard label="Fees Collected" value={isLoading ? "—" : formatNaira(collected)} delta={`${collectedPct}% of expected`} icon={Wallet} tone="gold" />
        <StatCard label="Attendance Rate" value={isLoading ? "—" : stats?.attendance_rate != null ? `${stats.attendance_rate}%` : "—"} delta="today" icon={CalendarCheck} tone="blue" />
        <StatCard label="Results Pending" value={isLoading ? "—" : stats?.results_pending ?? 0} delta="sheets awaiting approval" icon={ClipboardList} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Fee collection</CardTitle><span className="text-xs text-ink/45">This term</span></CardHeader>
          <CardBody>
            <div className="flex flex-wrap justify-between gap-4">
              <div><p className="text-sm text-ink/55">Expected</p><p className="font-display text-2xl text-ink">{formatNaira(expected)}</p></div>
              <div><p className="text-sm text-ink/55">Collected</p><p className="font-display text-2xl text-forest-600">{formatNaira(collected)}</p></div>
              <div><p className="text-sm text-ink/55">Outstanding</p><p className="font-display text-2xl text-red-600">{formatNaira(Math.max(0, expected - collected))}</p></div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-forest-500" style={{ width: `${collectedPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink/45">{collectedPct}% collected so far</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(tpath("/fees"))}>Go to fees</Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardBody className="space-y-2.5">
            <Button className="w-full justify-center" onClick={() => router.push(tpath("/students"))}><Users size={16} /> Manage students</Button>
            <Button variant="outline" className="w-full justify-center" onClick={() => router.push(tpath("/attendance"))}><CalendarCheck size={16} /> Attendance</Button>
            <Button variant="outline" className="w-full justify-center" onClick={() => router.push(tpath("/results"))}><ClipboardList size={16} /> Results</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
