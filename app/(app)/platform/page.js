"use client";

import Link from "next/link";
import { Building2, CreditCard, TrendingUp, Users, Plus, ArrowUpRight } from "lucide-react";
import { usePlatformOverview, usePlatformSchools } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Badge, { statusTone } from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

const STATUS_LABEL = { active: "Active", trial: "Trial", past_due: "Past due", suspended: "Suspended" };
const tone = (s) => statusTone(s === "past_due" || s === "suspended" ? "unpaid" : s === "trial" ? "partial" : "active");

export default function PlatformOverview() {
  const { stats, isLoading } = usePlatformOverview();
  const { items: schools } = usePlatformSchools();

  const s = stats || {};
  return (
    <div>
      <PageHeader title="Platform overview" subtitle="All schools on Sembly, at a glance">
        <Link href="/platform/onboarding"><Button><Plus size={16} /> Onboard school</Button></Link>
      </PageHeader>
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total schools" value={isLoading ? "—" : s.total_schools ?? 0} delta="on the platform" icon={Building2} tone="forest" />
        <StatCard label="Active subscriptions" value={isLoading ? "—" : s.active_subscriptions ?? 0} delta="paying customers" icon={CreditCard} tone="blue" />
        <StatCard label="Platform MRR" value={isLoading ? "—" : formatNaira(s.mrr ?? 0)} delta="monthly recurring" icon={TrendingUp} tone="gold" />
        <StatCard label="Students platform-wide" value={isLoading ? "—" : (s.students ?? 0).toLocaleString()} delta="across all schools" icon={Users} tone="amber" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle>Schools</CardTitle>
          <Link href="/platform/schools" className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:underline">View all <ArrowUpRight size={14} /></Link>
        </CardHeader>
        <Table>
          <THead><TR><TH>School</TH><TH>Plan</TH><TH className="text-right">Students</TH><TH className="text-right">MRR</TH><TH>Status</TH></TR></THead>
          <TBody>
            {schools.slice(0, 5).map((sc) => (
              <TR key={sc.id}>
                <TD><span className="font-medium text-ink">{sc.name}</span><span className="block text-xs text-ink/45">{sc.subdomain}.sembly.com</span></TD>
                <TD>{sc.plan}</TD>
                <TD className="text-right">{sc.students ?? 0}</TD>
                <TD className="text-right">{formatNaira(sc.mrr ?? 0)}</TD>
                <TD><Badge tone={tone(sc.status)}>{STATUS_LABEL[sc.status] || sc.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
