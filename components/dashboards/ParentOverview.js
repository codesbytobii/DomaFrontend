"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTenantPath } from "@/lib/tenant";
import { formatNaira } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import ChildSwitcher, { useCurrentChild } from "@/components/parent/ChildSwitcher";

export default function ParentOverview() {
  const child = useCurrentChild();
  const school = useStore((s) => s.school);
  const router = useRouter();
  const tpath = useTenantPath();

  if (!child) {
    return (
      <div>
        <PageHeader title="Overview" subtitle={school?.name} />
        <Card className="p-8 text-center text-ink/55">No children are linked to your account yet.</Card>
      </div>
    );
  }

  const balance = child.fee_balance ?? 0;

  return (
    <div>
      <PageHeader title={`${child.name.split(" ")[0]}'s overview`} subtitle={`${child.cls} · ${school?.name || ""}`} />
      <ChildSwitcher />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-ink/55">Term average</p><p className="mt-1 font-display text-2xl text-ink">{child.average ?? "—"}</p><p className="mt-3 text-xs text-ink/45">latest term</p></Card>
        <Card className="p-5"><p className="text-sm text-ink/55">Attendance</p><p className="mt-1 font-display text-2xl text-forest-600">{child.attendance_rate != null ? `${child.attendance_rate}%` : "—"}</p><p className="mt-3 text-xs text-ink/45">recent</p></Card>
        <Card className="p-5"><p className="text-sm text-ink/55">Fee balance</p><p className={`mt-1 font-display text-2xl ${balance > 0 ? "text-red-600" : "text-forest-600"}`}>{formatNaira(balance)}</p><p className="mt-3 text-xs text-ink/45">{balance > 0 ? "outstanding" : "paid in full"}</p></Card>
      </div>
      <Card className={`mt-4 flex flex-wrap items-center gap-4 p-5 ${balance > 0 ? "border-gold-200" : ""}`}>
        <div className="min-w-[200px] flex-1">
          <p className="font-medium text-ink">{balance > 0 ? `Outstanding balance of ${formatNaira(balance)}` : "School fees fully paid 🎉"}</p>
          <p className="text-sm text-ink/55">{balance > 0 ? "Pay securely with Paystack." : "Thank you — no action needed."}</p>
        </div>
        {balance > 0 && <Button variant="accent" onClick={() => router.push(tpath("/fees"))}>Pay now</Button>}
      </Card>
    </div>
  );
}
