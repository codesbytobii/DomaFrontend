"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Send, Search, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { useInvoices, useFeeSummary, useStudentInvoices, useCurrentTerm, recordPayment, initiatePayment } from "@/lib/api";
import { formatNaira, percent, getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Badge, { statusTone } from "@/components/shared/Badge";
import Modal from "@/components/shared/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";
import ChildSwitcher, { useCurrentChild } from "@/components/parent/ChildSwitcher";

export default function FeesPage() {
  const role = useStore((s) => s.user?.role);
  if (role === "parent") return <ParentFees />;
  return <AdminFees />;
}

/* ─── admin: fee collection + invoices ─── */
function AdminFees() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [payFor, setPayFor] = useState(null);

  const { items, isLoading, mutate } = useInvoices({ q: query, status });
  const { summary, isLoading: sumLoading } = useFeeSummary();

  const s = summary || {};
  const collectedPct = percent(s.total_paid ?? 0, s.total_expected ?? 0);

  return (
    <div>
      <PageHeader title="Fees & Finance" subtitle="Fee collection overview">
        <Button variant="outline" size="md" onClick={() => toast.success("SMS reminders queued")}><Send size={16} /> Send reminders</Button>
      </PageHeader>
      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-ink/55">Total Expected</p><p className="mt-1 font-display text-2xl text-ink">{sumLoading ? "—" : formatNaira(s.total_expected ?? 0)}</p><p className="mt-3 text-xs text-ink/45">{s.invoices_count ?? 0} invoices</p></Card>
        <Card className="p-5"><p className="text-sm text-ink/55">Collected</p><p className="mt-1 font-display text-2xl text-forest-600">{sumLoading ? "—" : formatNaira(s.total_paid ?? 0)}</p>
          <div className="mt-3"><div className="h-2 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-forest-500" style={{ width: `${collectedPct}%` }} /></div><p className="mt-1.5 text-xs text-ink/45">{collectedPct}% · {s.paid_count ?? 0} fully paid</p></div>
        </Card>
        <Card className="p-5"><p className="text-sm text-ink/55">Outstanding</p><p className="mt-1 font-display text-2xl text-red-600">{sumLoading ? "—" : formatNaira(s.outstanding ?? 0)}</p><p className="mt-3 text-xs text-ink/45">{s.partial_count ?? 0} partial · {s.unpaid_count ?? 0} unpaid</p></Card>
      </div>
      <Card className="mb-4 mt-6 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Input icon={Search} placeholder="Search student or invoice…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select placeholder="All statuses" options={["paid", "partial", "unpaid"]} value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="sm:w-44" />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <THead><TR><TH>Invoice</TH><TH>Student</TH><TH>Class</TH><TH className="text-right">Total</TH><TH className="text-right">Balance</TH><TH>Status</TH><TH className="text-right">Action</TH></TR></THead>
          <TBody>
            {isLoading && <TR><TD colSpan={7} className="py-8 text-center text-ink/45">Loading invoices…</TD></TR>}
            {items.map((i) => (
              <TR key={i.id}>
                <TD className="font-mono text-xs">{i.invoice_no}</TD>
                <TD className="font-medium text-ink">{i.student_name}</TD>
                <TD>{i.class_label}</TD>
                <TD className="text-right">{formatNaira(i.total_amount)}</TD>
                <TD className="text-right font-medium text-ink">{formatNaira(i.balance)}</TD>
                <TD><Badge tone={statusTone(i.status)}>{i.status}</Badge></TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => toast.success("Invoice exported (PDF coming soon)")}><Download size={14} /></Button>
                    {i.balance > 0 && <Button size="sm" variant="outline" onClick={() => setPayFor(i)}>Record</Button>}
                  </div>
                </TD>
              </TR>
            ))}
            {!isLoading && items.length === 0 && <TR><TD colSpan={7} className="py-8 text-center text-ink/45">No invoices match your filters.</TD></TR>}
          </TBody>
        </Table>
      </Card>
      <RecordPaymentModal invoice={payFor} onClose={() => setPayFor(null)} onSaved={() => { mutate(); setPayFor(null); }} />
    </div>
  );
}

function RecordPaymentModal({ invoice, onClose, onSaved }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    try {
      await recordPayment(invoice.id, { amount: Number(amount), method });
      toast.success(`${formatNaira(Number(amount))} recorded`);
      onSaved(); setAmount("");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={Boolean(invoice)} onClose={onClose} title="Record payment"
      footer={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={loading}>{loading ? "Recording…" : "Record payment"}</Button></>}>
      {invoice && (
        <div className="space-y-4">
          <div className="rounded-xl bg-paper p-4 text-sm"><p className="font-medium text-ink">{invoice.student_name} · {invoice.class_label}</p><p className="mt-0.5 font-mono text-xs text-ink/50">{invoice.invoice_no}</p><div className="mt-3 flex justify-between text-ink/65"><span>Outstanding</span><span className="font-semibold text-red-600">{formatNaira(invoice.balance)}</span></div></div>
          <Input label="Amount (₦)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          <Select label="Payment method" options={[{ value: "cash", label: "Cash" }, { value: "transfer", label: "Bank Transfer" }, { value: "pos", label: "POS" }, { value: "paystack", label: "Paystack" }, { value: "ussd", label: "USSD" }]} value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}

/* ─── parent: per-child fees + pay online ─── */
function ParentFees() {
  const child = useCurrentChild();
  const currentTerm = useCurrentTerm(true);
  const { items: invoices, isLoading, mutate } = useStudentInvoices(child?.id);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const unpaid = invoices.filter((i) => i.balance > 0)[0] || null;
  const totalBalance = invoices.reduce((s, i) => s + (i.balance ?? 0), 0);

  const handlePay = async () => {
    if (!unpaid) return;
    setPaying(true);
    try {
      const res = await initiatePayment(unpaid.id);
      if (res?.authorization_url) window.location.href = res.authorization_url;
      else toast.success("Payment initiated — redirecting to Paystack");
      setPayOpen(false); mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setPaying(false); }
  };

  return (
    <div>
      <PageHeader title="Fees" subtitle={child ? `${child.name} · ${currentTerm?.name || ""}` : "Fees"} />
      <ChildSwitcher />
      {isLoading && <Card className="p-8 text-center text-ink/45">Loading fee data…</Card>}
      {!isLoading && invoices.map((inv) => (
        <Card key={inv.id} className="mb-4 p-5">
          <p className="font-mono text-xs text-ink/45 mb-1">{inv.invoice_no}</p>
          <div className="flex flex-wrap justify-between gap-3">
            <div><p className="text-sm text-ink/55">Total billed</p><p className="font-display text-xl">{formatNaira(inv.total_amount)}</p></div>
            <div><p className="text-sm text-ink/55">Paid</p><p className="font-display text-xl text-forest-600">{formatNaira(inv.paid_amount)}</p></div>
            <div><p className="text-sm text-ink/55">Balance</p><p className={`font-display text-xl ${inv.balance > 0 ? "text-red-600" : "text-forest-600"}`}>{formatNaira(inv.balance)}</p></div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-forest-500" style={{ width: `${percent(inv.paid_amount, inv.total_amount)}%` }} /></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-ink/55">{inv.balance > 0 ? `Due ${inv.due_date || ""}` : "Fully paid"}</span>
            {inv.balance > 0 && <Button variant="accent" size="md" onClick={() => setPayOpen(true)}>Pay with Paystack</Button>}
          </div>
          {inv.payments?.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-2">Payment history</p>
              {inv.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-ink/60">{p.method} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                  <span className="font-medium">{formatNaira(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      {!isLoading && invoices.length === 0 && <Card className="p-8 text-center text-ink/45">No invoices found for this term.</Card>}

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pay school fees"
        footer={<><Button variant="subtle" onClick={() => setPayOpen(false)}>Cancel</Button><Button variant="accent" onClick={handlePay} disabled={paying}>{paying ? "Redirecting…" : `Pay ${formatNaira(totalBalance)}`}</Button></>}>
        <p className="text-sm text-ink/65">You'll be securely redirected to Paystack (card, transfer or USSD).</p>
        <div className="mt-3 flex justify-between rounded-xl bg-paper p-4 text-sm"><span className="text-ink/55">Amount due</span><b>{formatNaira(totalBalance)}</b></div>
      </Modal>
    </div>
  );
}
