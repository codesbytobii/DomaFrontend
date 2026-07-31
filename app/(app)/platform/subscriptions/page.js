"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Check, Pencil, Trash2, Users } from "lucide-react";
import { useSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from "@/lib/api";
import { formatNaira, getErrorMessage, MODULES, BILLING_CYCLES } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Button from "@/components/shared/Button";
import Badge from "@/components/shared/Badge";
import Modal from "@/components/shared/Modal";

const EMPTY_FORM = { name: "", description: "", mrr: "", billing_cycle: "monthly", features: [], is_active: true };
const CYCLE_SUFFIX = { monthly: "/mo", quarterly: "/qtr", biannual: "/6mo", annual: "/yr" };

/**
 * Platform > Subscriptions — the plan catalog super_admin manages. Schools
 * get assigned one of these at onboarding (see the onboarding page's plan
 * picker) rather than a one-off name/price typed in per school.
 */
export default function SubscriptionsPage() {
  const { items, isLoading, mutate } = useSubscriptionPlans();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, plan = editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing({}); setForm(EMPTY_FORM); };
  const openEdit = (plan) => {
    setEditing(plan);
    setForm({ name: plan.name, description: plan.description || "", mrr: String(plan.mrr), billing_cycle: plan.billing_cycle || "monthly", features: plan.features || [], is_active: plan.is_active });
  };
  const close = () => setEditing(null);

  const toggleFeature = (slug) => {
    setForm((f) => ({
      ...f,
      features: f.features.includes(slug) ? f.features.filter((x) => x !== slug) : [...f.features, slug],
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Plan name is required");
    const mrr = Number(form.mrr);
    if (Number.isNaN(mrr) || mrr < 0) return toast.error("Enter a valid price");
    if (form.features.length === 0) return toast.error("Select at least one module this plan includes");
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description.trim() || null, mrr, billing_cycle: form.billing_cycle, features: form.features, is_active: form.is_active };
    try {
      if (editing?.id) {
        await updateSubscriptionPlan(editing.id, payload);
        toast.success(`${form.name} updated`);
      } else {
        await createSubscriptionPlan(payload);
        toast.success(`${form.name} created`);
      }
      mutate(); close();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const remove = async (plan) => {
    if (plan.schools_count > 0) {
      toast.error(`${plan.schools_count} school(s) are on this plan — deactivate it or move them first.`);
      return;
    }
    if (!confirm(`Delete "${plan.name}"? This can't be undone.`)) return;
    try {
      await deleteSubscriptionPlan(plan.id);
      toast.success(`${plan.name} deleted`);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="The plan catalog schools are onboarded onto">
        <Button onClick={openCreate}><Plus size={16} /> New plan</Button>
      </PageHeader>

      {isLoading && <p className="text-sm text-ink/45">Loading plans…</p>}
      {!isLoading && items.length === 0 && (
        <Card className="p-10 text-center text-sm text-ink/45">
          No plans yet. Create your first one — schools are onboarded by picking from this list.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((plan) => (
          <Card key={plan.id} className={`flex flex-col p-5 ${!plan.is_active ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg text-ink">{plan.name}</p>
                <p className="mt-0.5 font-display text-2xl text-forest-600">
                  {formatNaira(plan.mrr)}<span className="text-sm font-sans font-normal text-ink/45">{CYCLE_SUFFIX[plan.billing_cycle] || "/mo"}</span>
                </p>
                {plan.billing_cycle !== "monthly" && (
                  <p className="text-xs text-ink/45">≈ {formatNaira(plan.monthly_equivalent)}/mo equivalent</p>
                )}
              </div>
              {!plan.is_active && <Badge tone="gray">Inactive</Badge>}
            </div>

            {plan.description && <p className="mt-2 text-sm text-ink/55">{plan.description}</p>}

            <div className="mt-4 flex-1 space-y-1.5">
              {Object.entries(MODULES).map(([slug, label]) => {
                const included = (plan.features || []).includes(slug);
                return (
                  <div key={slug} className={`flex items-center gap-2 text-xs ${included ? "text-ink" : "text-ink/30"}`}>
                    <Check size={13} className={included ? "text-forest-600" : "text-ink/20"} strokeWidth={3} />
                    {label}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink/45">
              <span className="flex items-center gap-1.5"><Users size={13} /> {plan.schools_count ?? 0} school{plan.schools_count === 1 ? "" : "s"}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(plan)} className="grid h-7 w-7 place-items-center rounded-md text-ink/50 hover:bg-paper hover:text-forest-600" aria-label="Edit"><Pencil size={14} /></button>
                <button onClick={() => remove(plan)} className="grid h-7 w-7 place-items-center rounded-md text-ink/50 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={Boolean(editing)} onClose={close} title={editing?.id ? `Edit ${editing.name}` : "New subscription plan"}
        footer={<>
          <Button variant="subtle" onClick={close}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save plan"}</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. School Suite" containerClassName="sm:col-span-1" />
            <Input label="Price (₦)" type="number" min="0" value={form.mrr} onChange={(e) => setForm({ ...form, mrr: e.target.value })} placeholder="e.g. 90000" />
            <Select label="Billing cycle" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
              options={Object.entries(BILLING_CYCLES).map(([value, c]) => ({ value, label: c.label }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Who this plan is for, e.g. 'Mid-size private schools'"
              rows={2}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">What this plan can do</label>
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
              {Object.entries(MODULES).map(([slug, label]) => (
                <label key={slug} className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
                  <input type="checkbox" checked={form.features.includes(slug)} onChange={() => toggleFeature(slug)}
                    className="h-4 w-4 rounded border-line text-forest-600 focus:ring-forest-300" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-line text-forest-600 focus:ring-forest-300" />
            Active — visible when onboarding a new school
          </label>
        </div>
      </Modal>
    </div>
  );
}