"use client";

import { useSubscriptions } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Badge, { statusTone } from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

const STATUS_LABEL = { active: "Active", trial: "Trial", past_due: "Past due", suspended: "Suspended" };
const tone = (s) => statusTone(s === "past_due" || s === "suspended" ? "unpaid" : s === "trial" ? "partial" : "active");

const PLANS = ["Starter", "School Suite", "Full School"];
const PLAN_PRICE = { "Starter": 35000, "School Suite": 90000, "Full School": 150000 };

export default function SubscriptionsPage() {
  const { items, isLoading } = useSubscriptions();

  const planTotals = PLANS.map((plan) => {
    const schools = items.filter((s) => s.plan === plan);
    return { plan, count: schools.length, revenue: schools.reduce((t, s) => t + (s.mrr ?? 0), 0) };
  });

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Renewals, trials and past-due accounts" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {planTotals.map((p) => (
          <Card key={p.plan} className="p-5">
            <p className="font-medium text-ink">{p.plan}</p>
            <p className="mt-1 font-display text-2xl text-forest-600">{formatNaira(p.revenue)}</p>
            <p className="mt-2 text-xs text-ink/45">{p.count} school{p.count !== 1 ? "s" : ""} · {formatNaira(PLAN_PRICE[p.plan] || 0)}/mo each</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <Table>
          <THead><TR><TH>School</TH><TH>Plan</TH><TH>Renews</TH><TH className="text-right">MRR</TH><TH>Status</TH></TR></THead>
          <TBody>
            {isLoading && <TR><TD colSpan={5} className="py-8 text-center text-ink/45">Loading…</TD></TR>}
            {items.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium text-ink">{s.name}</TD>
                <TD>{s.plan}</TD>
                <TD>{s.renews_at || "—"}</TD>
                <TD className="text-right">{formatNaira(s.mrr ?? 0)}</TD>
                <TD><Badge tone={tone(s.status)}>{STATUS_LABEL[s.status] || s.status}</Badge></TD>
              </TR>
            ))}
            {!isLoading && items.length === 0 && <TR><TD colSpan={5} className="py-8 text-center text-ink/45">No schools yet.</TD></TR>}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
