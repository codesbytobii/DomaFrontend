"use client";

import { useSubscriptions } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Badge, { statusTone } from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

const STATUS_LABEL = { active: "Active", trial: "Trial", past_due: "Past due", suspended: "Suspended" };
const tone = (s) => statusTone(s === "past_due" || s === "suspended" ? "unpaid" : s === "trial" ? "partial" : "active");

export default function SubscriptionsPage() {
  const { items, isLoading } = useSubscriptions();

  // Plans are free-form now (no fixed catalog), so there's no fixed set of
  // tiers to group into — show real totals across whatever plans actually
  // exist instead of three hardcoded cards.
  const totalMrr = items.reduce((t, s) => t + (s.mrr ?? 0), 0);
  const activeCount = items.filter((s) => s.status !== "suspended").length;
  const avgMrr = items.length ? Math.round(totalMrr / items.length) : 0;
  const distinctPlans = new Set(items.map((s) => s.plan)).size;

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Renewals, trials and past-due accounts" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-medium text-ink">Total MRR</p>
          <p className="mt-1 font-display text-2xl text-forest-600">{formatNaira(totalMrr)}</p>
          <p className="mt-2 text-xs text-ink/45">Across {activeCount} active school{activeCount !== 1 ? "s" : ""}</p>
        </Card>
        <Card className="p-5">
          <p className="font-medium text-ink">Average price</p>
          <p className="mt-1 font-display text-2xl text-forest-600">{formatNaira(avgMrr)}</p>
          <p className="mt-2 text-xs text-ink/45">Per school, per month</p>
        </Card>
        <Card className="p-5">
          <p className="font-medium text-ink">Distinct plans</p>
          <p className="mt-1 font-display text-2xl text-forest-600">{distinctPlans}</p>
          <p className="mt-2 text-xs text-ink/45">Custom terms set per school</p>
        </Card>
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