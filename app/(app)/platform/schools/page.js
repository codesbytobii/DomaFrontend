"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { usePlatformSchools, changePlan, suspendSchool, deleteSchool, useSubscriptionPlans } from "@/lib/api";
import { formatNaira, getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Button from "@/components/shared/Button";
import Badge, { statusTone } from "@/components/shared/Badge";
import Modal from "@/components/shared/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

const STATUS_LABEL = { active: "Active", trial: "Trial", past_due: "Past due", suspended: "Suspended" };
const tone = (s) => statusTone(s === "past_due" || s === "suspended" ? "unpaid" : s === "trial" ? "partial" : "active");

export default function PlatformSchools() {
  const [query, setQuery] = useState("");
  const { items, isLoading, mutate } = usePlatformSchools(query);
  const { items: plans } = useSubscriptionPlans();
  const activePlans = plans.filter((p) => p.is_active);
  const [detail, setDetail] = useState(null);
  const [planId, setPlanId] = useState("");
  const [acting, setActing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const openDetail = (s) => { setDetail(s); setPlanId(s.subscription_plan_id ? String(s.subscription_plan_id) : ""); setConfirmDelete(false); setDeleteText(""); };

  // Reassigns to a different catalog plan — no free-text override anymore;
  // plan name/price only ever come from what's set up under Subscriptions.
  const handleChangePlan = async () => {
    if (!planId || !detail) return;
    setActing(true);
    try {
      await changePlan(detail.id, { subscription_plan_id: Number(planId) });
      toast.success(`${detail.name}'s subscription updated`);
      mutate(); setDetail(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActing(false); }
  };

  const handleSuspend = async () => {
    if (!detail) return;
    setActing(true);
    try {
      await suspendSchool(detail.id);
      toast.success(`${detail.name} suspended`);
      mutate(); setDetail(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActing(false); }
  };

  // Deleting a school is permanent — every student, result, invoice, and
  // staff/parent account under it is gone too. Typing the school's exact
  // name is the only guard against a misclick on something this
  // irreversible.
  const handleDelete = async () => {
    if (!detail || deleteText !== detail.name) return;
    setActing(true);
    try {
      await deleteSchool(detail.id);
      toast.success(`${detail.name} deleted`);
      mutate(); setDetail(null); setConfirmDelete(false); setDeleteText("");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActing(false); }
  };

  return (
    <div>
      <PageHeader title="Schools" subtitle="Every school on the platform" />
      <Card className="mb-4 p-4"><Input icon={Search} placeholder="Filter by name…" value={query} onChange={(e) => setQuery(e.target.value)} containerClassName="max-w-sm" /></Card>
      <Card className="overflow-hidden">
        <Table>
          <THead><TR><TH>School</TH><TH>Plan</TH><TH className="text-right">Students</TH><TH className="text-right">MRR</TH><TH>Owner</TH><TH>Status</TH></TR></THead>
          <TBody>
            {isLoading && <TR><TD colSpan={6} className="py-8 text-center text-ink/45">Loading schools…</TD></TR>}
            {items.map((s) => (
              <TR key={s.id} className="cursor-pointer" onClick={() => openDetail(s)}>
                <TD><span className="font-medium text-ink">{s.name}</span><span className="block text-xs text-ink/45">{s.subdomain}.sembly.com</span></TD>
                <TD>{s.plan}</TD>
                <TD className="text-right">{s.students ?? 0}</TD>
                <TD className="text-right">{formatNaira(s.mrr ?? 0)}</TD>
                <TD>{s.owner || "—"}</TD>
                <TD><Badge tone={tone(s.status)}>{STATUS_LABEL[s.status] || s.status}</Badge></TD>
              </TR>
            ))}
            {!isLoading && items.length === 0 && <TR><TD colSpan={6} className="py-8 text-center text-ink/45">No schools found.</TD></TR>}
          </TBody>
        </Table>
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name || ""}
        footer={<>
          <Button variant="subtle" onClick={() => setDetail(null)}>Close</Button>
          <Button variant="outline" onClick={handleChangePlan} disabled={acting || !planId || planId === String(detail?.subscription_plan_id || "")}>{acting ? "Saving…" : "Save subscription"}</Button>
          <Button variant="danger" onClick={handleSuspend} disabled={acting || detail?.status === "suspended"}>{detail?.status === "suspended" ? "Suspended" : "Suspend"}</Button>
        </>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-ink/55">{detail.subdomain}.sembly.com</span><Badge tone={tone(detail.status)}>{STATUS_LABEL[detail.status] || detail.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-ink/50">Students</p><p className="mt-1 font-display text-lg">{detail.students ?? 0}</p></div>
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-ink/50">Monthly</p><p className="mt-1 font-display text-lg text-forest-600">{formatNaira(detail.mrr ?? 0)}</p></div>
            </div>

            {/* Reassign to a different catalog plan — plan name/price are
               managed once, under Platform > Subscriptions. */}
            <Select
              label="Subscription plan"
              options={activePlans.map((p) => ({ value: String(p.id), label: `${p.name} — ${formatNaira(p.mrr)}/mo` }))}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              placeholder="Select a plan"
            />

            <div className="border-t border-line pt-3 text-sm">
              {detail.owner && <div className="flex justify-between py-1"><span className="text-ink/55">Owner</span><span>{detail.owner}</span></div>}
              {detail.renews_at && <div className="flex justify-between py-1"><span className="text-ink/55">Renews</span><span>{detail.renews_at}</span></div>}
            </div>

            {/* Danger zone — separated visually and gated behind typing the
               school's name, since this action can't be undone. */}
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
              <p className="text-sm font-medium text-red-700">Danger zone</p>
              {!confirmDelete ? (
                <>
                  <p className="mt-1 text-xs text-red-600/80">Permanently deletes this school and everything under it — students, results, fees, staff and parent accounts. This cannot be undone.</p>
                  <Button variant="danger" className="mt-3" onClick={() => setConfirmDelete(true)}>Delete school…</Button>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-red-600/80">Type <span className="font-mono font-semibold">{detail.name}</span> to confirm permanent deletion.</p>
                  <Input containerClassName="mt-2" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder={detail.name} />
                  <div className="mt-3 flex gap-2">
                    <Button variant="subtle" onClick={() => { setConfirmDelete(false); setDeleteText(""); }}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={acting || deleteText !== detail.name}>{acting ? "Deleting…" : "Permanently delete"}</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}