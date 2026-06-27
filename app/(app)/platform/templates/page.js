"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { usePlatformTemplates, createTemplate, updateTemplate } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import { downloadNode } from "@/lib/print";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Modal from "@/components/shared/Modal";
import ReportCard from "@/components/results/ReportCard";

const PLAN_NAMES = ["Starter", "School Suite", "Full School"];
const SAMPLE_SCHOOL = { name: "Sample School", address: "Lagos, Nigeria", motto: "Excellence Always" };
const SAMPLE_CHILD = {
  name: "Sample Student", cls: "JSS2A", class_size: 30,
  results: [["Mathematics", 16, 15, 47], ["English Language", 15, 14, 43], ["Basic Science", 13, 12, 40]],
  attendance: { rate: 94 },
  remark_teacher: "A dedicated and focused student.",
  remark_principal: "Keep up the excellent work.",
};

function Thumb({ base }) {
  const blocks = { classic: ["#fff", "#fff"], minimal: ["#f3f3f3"], modern: ["#EAF3EE", "#FDF6E9", "#fff"], branded: ["#F6E8F1", "#7A1F5C", "#fff"] }[base] || ["#fff"];
  return <div className="flex h-16 gap-1 rounded-lg border border-line bg-paper p-2">{blocks.map((c, i) => <div key={i} className="flex-1 rounded" style={{ background: c, border: c === "#fff" ? "1px solid #d8ddd5" : "none" }} />)}</div>;
}

export default function PlatformTemplates() {
  const { items: templates, isLoading, mutate } = usePlatformTemplates();
  const [createOpen, setCreateOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const previewRef = useRef(null);
  const [saving, setSaving] = useState(null);

  const togglePackage = async (template, plan) => {
    const newPackages = template.packages.includes(plan) ? template.packages.filter((p) => p !== plan) : [...template.packages, plan];
    setSaving(template.id);
    try {
      await updateTemplate(template.id, { packages: newPackages });
      toast.success("Packages updated"); mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(null); }
  };

  return (
    <div>
      <PageHeader title="Template library" subtitle="Create report-card templates and assign them to subscription packages">
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Create template</Button>
      </PageHeader>
      {isLoading && <p className="text-sm text-ink/45">Loading templates…</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id || t.key} className="flex flex-col p-4">
            <Thumb base={t.base} />
            <h3 className="mt-3 font-medium text-ink">{t.name}</h3>
            <p className="mt-1 flex-1 text-sm text-ink/55">{t.desc}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink/40">Available in</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PLAN_NAMES.map((p) => {
                const on = (t.packages || []).includes(p);
                return <button key={p} disabled={saving === (t.id || t.key)} onClick={() => togglePackage(t, p)} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", on ? "border-forest-300 bg-forest-50 text-forest-700" : "border-line text-ink/45 hover:bg-paper")}>{p}</button>;
              })}
            </div>
            <Button variant="outline" size="sm" className="mt-3 self-start" onClick={() => setPreview(t)}>Preview</Button>
          </Card>
        ))}
      </div>
      <p className="mt-5 rounded-xl border border-dashed border-line bg-white p-4 text-sm text-ink/55">A template is available to a school only if the school's plan is one of its assigned packages.</p>

      <CreateTemplateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { mutate(); setCreateOpen(false); }} />

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={`Preview — ${preview?.name || ""}`} size="xl"
        footer={<><Button variant="subtle" onClick={() => setPreview(null)}>Close</Button><Button onClick={() => downloadNode(previewRef.current, "Report Card")}>⤓ Download PDF</Button></>}>
        {preview && <div className="bg-paper p-3"><ReportCard ref={previewRef} child={SAMPLE_CHILD} base={preview.base} school={SAMPLE_SCHOOL} /></div>}
      </Modal>
    </div>
  );
}

function CreateTemplateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", base: "classic" });
  const [packs, setPacks] = useState(["School Suite", "Full School"]);
  const [loading, setLoading] = useState(false);

  const toggle = (p) => setPacks((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const submit = async () => {
    if (!form.name) return toast.error("Enter a template name");
    setLoading(true);
    try {
      await createTemplate({ name: form.name, description: form.description, base: form.base, packages: packs });
      toast.success(`"${form.name}" added`);
      onCreated();
      setForm({ name: "", description: "", base: "classic" });
      setPacks(["School Suite", "Full School"]);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create template"
      footer={<><Button variant="subtle" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={loading}>{loading ? "Creating…" : "Create"}</Button></>}>
      <div className="space-y-4">
        <Input label="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Branded" />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
        <Select label="Base layout" options={[{ value: "classic", label: "Classic" }, { value: "modern", label: "Modern" }, { value: "minimal", label: "Minimal" }, { value: "branded", label: "Branded" }]} value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Available in packages</label>
          <div className="flex flex-wrap gap-1.5">
            {PLAN_NAMES.map((p) => <button key={p} onClick={() => toggle(p)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", packs.includes(p) ? "border-forest-300 bg-forest-50 text-forest-700" : "border-line text-ink/45")}>{p}</button>)}
          </div>
        </div>
      </div>
    </Modal>
  );
}
