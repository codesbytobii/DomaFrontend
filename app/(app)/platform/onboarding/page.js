"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { onboardSchool, useSubscriptionPlans } from "@/lib/api";
import { getErrorMessage, formatNaira, NG_STATES, SCHOOL_TYPES } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card, { CardBody } from "@/components/shared/Card";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Button from "@/components/shared/Button";

export default function OnboardingPage() {
  const { items: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const activePlans = plans.filter((p) => p.is_active);

  const [form, setForm] = useState({
    name: "", sub: "", rcNumber: "", schoolType: "", yearEstablished: "", motto: "",
    state: "", lga: "", phone: "", email: "",
    subscriptionPlanId: "", trialDays: "14", owner: "", ownerEmail: "",
    gradingSystem: "WAEC (A1–F9)",
  });
  const [subTouched, setSubTouched] = useState(false);
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(false);

  const u = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setName = (name) => setForm((f) => ({
    ...f, name,
    sub: subTouched ? f.sub : name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16),
  }));

  const submit = async () => {
    if (!form.name) return toast.error("School name is required");
    if (!form.sub) return toast.error("Subdomain is required");
    if (!form.subscriptionPlanId) return toast.error("Select a subscription plan");
    if (!form.owner || !form.ownerEmail) return toast.error("Owner name and email are required");
    setLoading(true);
    try {
      const school = await onboardSchool({
        name: form.name, subdomain: form.sub,
        subscription_plan_id: Number(form.subscriptionPlanId),
        trial_days: form.trialDays ? Number(form.trialDays) : undefined,
        owner_name: form.owner, owner_email: form.ownerEmail,
      });
      toast.success(`${form.name} created!`);
      setDone(school);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const Sec = ({ num, title }) => (
    <div className="flex items-center gap-3 my-5 first:mt-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-600 text-[11px] font-semibold text-white">{num}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/50 whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );

  if (done) {
    return (
      <div>
        <PageHeader title="Onboard a school" subtitle="Creates the tenant and the owner's first login" />
        <Card className="mx-auto max-w-md p-10 text-center">
          <CheckCircle2 size={44} className="mx-auto text-forest-500" />
          <h2 className="mt-4 font-display text-2xl text-ink">{done.name || form.name}</h2>
          <p className="mt-2 text-sm text-ink/55">Created successfully. The owner will receive login credentials by email.</p>
          <div className="mt-6 rounded-xl border border-line bg-paper p-4 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">Workspace URL</p>
            <p className="mt-2 font-mono text-sm text-forest-700">sembly.com/{done.subdomain || form.sub}</p>
          </div>
          <Button className="mt-6" variant="outline" onClick={() => { setDone(null); setForm({ name:"",sub:"",rcNumber:"",schoolType:"",yearEstablished:"",motto:"",state:"",lga:"",phone:"",email:"",subscriptionPlanId:"",trialDays:"14",owner:"",ownerEmail:"",gradingSystem:"WAEC (A1–F9)" }); setSubTouched(false); }}>
            Onboard another school
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Onboard a school" subtitle="Creates the school workspace and sends the admin their first login" />
      <Card className="max-w-2xl">
        {/* Form header */}
        <div className="bg-forest-700 px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Super admin · onboarding</p>
          <h2 className="mt-1 font-display text-xl text-white">School registration</h2>
          <p className="mt-0.5 text-xs text-white/65">Accurate details appear on all official documents and report cards</p>
        </div>
        <CardBody>
          <Sec num="1" title="School identity" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full school name" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="As registered with CAC" containerClassName="sm:col-span-2" />
            <Input label="RC number (CAC registration)" value={form.rcNumber} onChange={u("rcNumber")} placeholder="e.g. RC1234567"
              hint="Company registration number from the Corporate Affairs Commission" />
            <Select label="School type" options={SCHOOL_TYPES} value={form.schoolType} onChange={u("schoolType")} placeholder="Select type" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
            <Input label="Year established" type="number" value={form.yearEstablished} onChange={u("yearEstablished")} placeholder="e.g. 1998" />
            <Input label="School motto" value={form.motto} onChange={u("motto")} placeholder="e.g. Knowledge, Character, Service" />
          </div>

          <Sec num="2" title="Subdomain & plan" />
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Workspace subdomain</label>
            <div className="flex items-center gap-2">
              <input value={form.sub} onChange={(e) => { setSubTouched(true); setForm({ ...form, sub: e.target.value.replace(/[^a-z0-9-]/g, "") }); }}
                placeholder="schoolname" className="h-10 max-w-[200px] rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200" />
              <span className="text-sm text-ink/55">.sembly.com</span>
            </div>
          </div>
          <Select
            label="Subscription plan"
            options={activePlans.map((p) => ({ value: String(p.id), label: `${p.name} — ${formatNaira(p.mrr)}/mo` }))}
            value={form.subscriptionPlanId}
            onChange={u("subscriptionPlanId")}
            placeholder={plansLoading ? "Loading plans…" : activePlans.length ? "Select a plan" : "No active plans — create one under Subscriptions first"}
          />
          <Input label="Trial length (days)" type="number" min="0" value={form.trialDays} onChange={u("trialDays")} placeholder="14" containerClassName="mt-2 max-w-[160px]" />

          <Sec num="3" title="Location & contact" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select label="State" options={NG_STATES} value={form.state} onChange={u("state")} placeholder="Select state" />
            <Input label="LGA" value={form.lga} onChange={u("lga")} placeholder="Local Government Area" />
            <Input label="Phone number" value={form.phone} onChange={u("phone")} placeholder="+234 800 000 0000" />
          </div>
          <Input label="Official email address" type="email" value={form.email} onChange={u("email")} placeholder="info@yourschool.edu.ng" containerClassName="mt-2" />

          <Sec num="4" title="Administration" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Proprietor / director full name" value={form.owner} onChange={u("owner")} placeholder="Full legal name" />
            <Input label="Owner account email" type="email" value={form.ownerEmail} onChange={u("ownerEmail")} placeholder="admin@school.edu.ng"
              hint="This becomes the school admin's login email" />
          </div>
          <Select label="Grading system" options={["WAEC (A1–F9)", "Percentage (0–100)", "GPA (0–4.0)", "Custom"]} value={form.gradingSystem} onChange={u("gradingSystem")} containerClassName="mt-2" />

          <div className="mt-6 rounded-xl border border-line bg-paper p-4">
            <p className="text-sm font-medium text-ink">What happens next?</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink/55">The school admin receives a login email with a temporary password. From their dashboard they can upload their logo, set brand colors, configure classes, add students and staff, and customise their grading system.</p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="subtle" onClick={() => setForm({ name:"",sub:"",rcNumber:"",schoolType:"",yearEstablished:"",motto:"",state:"",lga:"",phone:"",email:"",subscriptionPlanId:"",trialDays:"14",owner:"",ownerEmail:"",gradingSystem:"WAEC (A1–F9)" })}>Clear form</Button>
            <Button onClick={submit} disabled={loading}>{loading ? "Creating school…" : "Create school & send credentials"}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}