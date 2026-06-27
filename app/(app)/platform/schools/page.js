"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { usePlatformSchools, changePlan, suspendSchool } from "@/lib/api";
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
  const [detail, setDetail] = useState(null);
  const [planChange, setPlanChange] = useState("");
  const [acting, setActing] = useState(false);

  const handleChangePlan = async () => {
    if (!planChange || !detail) return;
    setActing(true);
    try {
      await changePlan(detail.id, planChange);
      toast.success(`Plan changed to ${planChange}`);
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
              <TR key={s.id} className="cursor-pointer" onClick={() => { setDetail(s); setPlanChange(s.plan); }}>
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
          <Button variant="outline" onClick={handleChangePlan} disabled={acting || planChange === detail?.plan}>{acting ? "Saving…" : "Change plan"}</Button>
          <Button variant="danger" onClick={handleSuspend} disabled={acting || detail?.status === "suspended"}>{detail?.status === "suspended" ? "Suspended" : "Suspend"}</Button>
        </>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-ink/55">{detail.subdomain}.sembly.com</span><Badge tone={tone(detail.status)}>{STATUS_LABEL[detail.status] || detail.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-ink/50">Students</p><p className="mt-1 font-display text-lg">{detail.students ?? 0}</p></div>
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-ink/50">Monthly</p><p className="mt-1 font-display text-lg text-forest-600">{formatNaira(detail.mrr ?? 0)}</p></div>
            </div>
            <div>
              <Select label="Plan" options={[{ value: "Starter", label: "Starter — ₦35,000/mo" }, { value: "School Suite", label: "School Suite — ₦90,000/mo" }, { value: "Full School", label: "Full School — ₦150,000/mo" }]} value={planChange} onChange={(e) => setPlanChange(e.target.value)} />
            </div>
            <div className="border-t border-line pt-3 text-sm">
              {detail.owner && <div className="flex justify-between py-1"><span className="text-ink/55">Owner</span><span>{detail.owner}</span></div>}
              {detail.renews_at && <div className="flex justify-between py-1"><span className="text-ink/55">Renews</span><span>{detail.renews_at}</span></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
