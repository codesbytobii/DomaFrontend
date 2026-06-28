"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Building2, GraduationCap, CalendarRange, LayoutTemplate, Check, Lock, Palette, Upload, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSessions, useGradeScale, useSchoolTemplates, updateSchool, setDefaultTemplate as apiSetDefault, createSession, createTerm, openTerm, closeTerm, setCurrentTerm } from "@/lib/api";
import { isTemplateAvailable, lowestPlanFor } from "@/lib/templates";
import { getErrorMessage, cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Badge from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

const TABS = [
  { key: "general", label: "General", icon: Building2 },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "grading", label: "Grading Scale", icon: GraduationCap },
  { key: "academic", label: "Academic", icon: CalendarRange },
  { key: "templates", label: "Report Card", icon: LayoutTemplate },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("general");
  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your school, branding, grading and academic calendar" />
      <div className="mb-5 flex gap-1 border-b border-line overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === key ? "border-forest-500 text-forest-700" : "border-transparent text-ink/50 hover:text-ink/75")}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {tab === "general" && <GeneralTab />}
      {tab === "branding" && <BrandingTab />}
      {tab === "grading" && <GradingTab />}
      {tab === "academic" && <AcademicTab />}
      {tab === "templates" && <TemplatesTab />}
    </div>
  );
}

/* ─── General ─── */
function GeneralTab() {
  const school = useStore((s) => s.school);
  const setSchool = useStore((s) => s.setSchool);
  const [form, setForm] = useState({ name: school?.name || "", phone: school?.phone || "", email: school?.email || "", address: school?.address || "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { const updated = await updateSchool(form); setSchool(updated); toast.success("School profile saved"); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };
  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>School profile</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="School name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} containerClassName="sm:col-span-2" />
        <Input label="Plan" defaultValue={school?.plan} disabled />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} containerClassName="sm:col-span-2" />
        <div className="sm:col-span-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
      </CardBody>
    </Card>
  );
}

/* ─── Branding ─── */
function BrandingTab() {
  const brandColor = useStore((s) => s.brandColor);
  const setBrandColor = useStore((s) => s.setBrandColor);
  const accentColor = useStore((s) => s.accentColor);
  const setAccentColor = useStore((s) => s.setAccentColor);
  const logoUrl = useStore((s) => s.logoUrl);
  const setLogoUrl = useStore((s) => s.setLogoUrl);
  const stampUrl = useStore((s) => s.stampUrl);
  const setStampUrl = useStore((s) => s.setStampUrl);
  const school = useStore((s) => s.school);

  const [primary, setPrimary] = useState(brandColor || "#1B6B3A");
  const [secondary, setSecondary] = useState(accentColor || "#E8A020");
  const [saved, setSaved] = useState(false);
  const logoRef = useRef();
  const stampRef = useRef();

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setLogoUrl(ev.target.result); r.readAsDataURL(file); }
  };
  const handleStamp = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setStampUrl(ev.target.result); r.readAsDataURL(file); }
  };

  const applyBranding = () => {
    setBrandColor(primary);
    setAccentColor(secondary);
    document.documentElement.style.setProperty("--brand-color", primary);
    document.documentElement.style.setProperty("--accent-color", secondary);
    setSaved(true);
    toast.success("Branding applied — sidebar and header updated");
    setTimeout(() => setSaved(false), 2000);
  };

  const PRESETS = [["Forest green","#1B6B3A"],["Deep navy","#1A3C6B"],["Burgundy","#7B1C2E"],["Royal purple","#4A1C7B"],["Teal","#1B5C6B"],["Dark brown","#5C3D1A"]];

  const schoolName = school?.name || "Your School";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
      {/* Settings panel */}
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Logo & stamp</CardTitle></CardHeader>
          <CardBody className="space-y-5">
            {/* Logo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink/70">School logo</label>
              <div className="flex items-center gap-3">
                <div onClick={() => logoRef.current.click()}
                  className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-paper"
                  style={{ borderColor: logoUrl ? primary : undefined }}>
                  {logoUrl ? <img src={logoUrl} className="h-full w-full object-contain" alt="logo" /> : <Upload size={18} className="text-ink/30" />}
                </div>
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                <div>
                  <Button variant="outline" size="sm" onClick={() => logoRef.current.click()}><Upload size={13} /> Upload logo</Button>
                  <p className="mt-1.5 text-xs text-ink/40">PNG / SVG, transparent bg, min 200×200px</p>
                  {logoUrl && <p className="mt-0.5 text-xs text-forest-600">Logo uploaded ✓</p>}
                </div>
              </div>
            </div>

            {/* Stamp */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                Official stamp / seal <span className="text-xs font-normal text-ink/40">(optional)</span>
              </label>
              <p className="mb-2.5 text-xs leading-relaxed text-ink/45">
                When uploaded, the stamp appears as a digital signature on approved result sheets and on official communications sent to staff and parents.
              </p>
              <div className="flex items-center gap-3">
                <div onClick={() => stampRef.current.click()}
                  className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-line bg-paper"
                  style={{ borderColor: stampUrl ? primary : undefined }}>
                  {stampUrl ? <img src={stampUrl} className="h-full w-full object-contain" alt="stamp" /> : <Upload size={18} className="text-ink/30" />}
                </div>
                <input ref={stampRef} type="file" accept="image/*" onChange={handleStamp} className="hidden" />
                <div>
                  <Button variant="outline" size="sm" onClick={() => stampRef.current.click()}><Upload size={13} /> Upload stamp</Button>
                  {stampUrl && <p className="mt-1.5 text-xs text-forest-600">Stamp uploaded ✓</p>}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Brand colors</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70">Primary color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-line p-1" />
                  <input value={primary} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setPrimary(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-line bg-white px-3 font-mono text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200" />
                </div>
                <p className="mt-1 text-xs text-ink/40">Sidebar, headers, buttons</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70">Secondary color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-line p-1" />
                  <input value={secondary} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setSecondary(e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-line bg-white px-3 font-mono text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200" />
                </div>
                <p className="mt-1 text-xs text-ink/40">Badges, highlights, term pill</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-ink/50">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(([name, hex]) => (
                  <button key={hex} onClick={() => setPrimary(hex)} title={name}
                    className="h-7 w-7 rounded-md transition-all"
                    style={{ background: hex, border: primary === hex ? "3px solid #14201A" : "2px solid transparent" }} />
                ))}
              </div>
            </div>

            <Button onClick={applyBranding} className="w-full justify-center">
              {saved ? <><Check size={15} /> Applied!</> : "Apply branding to workspace"}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Live preview */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/40">Live preview</p>
        <div className="space-y-3">
          {/* Sidebar preview */}
          <Card className="overflow-hidden">
            <div style={{ background: primary }} className="flex items-center gap-3 p-3">
              {logoUrl
                ? <img src={logoUrl} className="h-8 w-8 rounded-lg object-contain" style={{ background: "rgba(255,255,255,0.15)" }} alt="logo" />
                : <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: "rgba(255,255,255,0.2)" }}>{schoolName[0]}</div>
              }
              <div>
                <p className="text-sm font-medium text-white">{schoolName}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>School admin · 2nd term</p>
              </div>
            </div>
            <div className="p-1">
              {["Dashboard","Students","Results","Fees"].map((item, i) => (
                <div key={item} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs"
                  style={{ background: i === 0 ? `${primary}15` : "transparent", borderLeft: i === 0 ? `2.5px solid ${primary}` : "2.5px solid transparent", color: i === 0 ? primary : "#6B7C75", fontWeight: i === 0 ? 500 : 400 }}>
                  {item}
                </div>
              ))}
            </div>
          </Card>

          {/* Buttons & badges preview */}
          <Card className="p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">Buttons & badges</p>
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ background: primary }}>Save changes</button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ border: `1px solid ${primary}`, color: primary }}>View report</button>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${secondary}25`, color: secondary }}>2nd term</span>
              <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${primary}15`, color: primary }}>Active</span>
            </div>
          </Card>

          {/* Report card header preview */}
          <Card className="overflow-hidden">
            <div style={{ background: primary }} className="flex items-center gap-3 p-3">
              {logoUrl
                ? <img src={logoUrl} className="h-10 w-10 rounded-md object-contain p-0.5" style={{ background: "rgba(255,255,255,0.12)" }} alt="logo" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-md text-base font-bold text-white" style={{ background: "rgba(255,255,255,0.18)" }}>{schoolName[0]}</div>
              }
              <div className="flex-1 text-center">
                <p className="font-display text-sm font-semibold text-white">{schoolName.toUpperCase()}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>STUDENT REPORT CARD — 2ND TERM, 2024/2025</p>
              </div>
            </div>
            <div className="px-4 py-2 text-xs text-ink/55">
              Student: <strong>Chidinma Okafor</strong> · Class: <strong>JSS2A</strong> · Average: <strong style={{ color: secondary }}>73.5</strong>
            </div>
            {/* Signature row with stamp */}
            <div className="flex items-end justify-between border-t border-line px-4 py-3">
              <div className="text-center">
                <div className="mx-auto mb-1 h-px w-20 bg-line" />
                <p className="text-[9px] text-ink/40">Class teacher</p>
              </div>
              <div className="text-center">
                {stampUrl
                  ? <img src={stampUrl} className="mx-auto mb-1 h-12 w-12 object-contain opacity-80" alt="stamp" />
                  : <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-line"><span className="text-[9px] text-ink/30">Stamp</span></div>
                }
                <p className="text-[9px] text-ink/40">School seal</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-1 h-px w-20 bg-line" />
                <p className="text-[9px] text-ink/40">Principal</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Grading ─── */
function GradingTab() {
  const { bands, isLoading } = useGradeScale();
  return (
    <Card className="max-w-2xl overflow-hidden">
      <CardHeader><CardTitle>Grading scale</CardTitle></CardHeader>
      <Table>
        <THead><TR><TH>Grade</TH><TH>Min</TH><TH>Max</TH><TH>Remark</TH></TR></THead>
        <TBody>
          {isLoading && <TR><TD colSpan={4} className="py-6 text-center text-ink/45">Loading…</TD></TR>}
          {bands.map((g) => (
            <TR key={g.grade}>
              <TD><Badge tone={g.min >= 50 ? "forest" : g.min >= 40 ? "amber" : "red"}>{g.grade}</Badge></TD>
              <TD>{g.min}</TD><TD>{g.max}</TD><TD>{g.remark}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}

/* ─── Academic ─── */
function AcademicTab() {
  const { sessions, isLoading, mutate } = useSessions();
  const [newSession, setNewSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ name: "", start_date: "", end_date: "" });
  const [newTermFor, setNewTermFor] = useState(null); // session id
  const [termName, setTermName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreateSession = async () => {
    if (!sessionForm.name.trim()) return toast.error("Enter a session name e.g. 2025/2026");
    setSaving(true);
    try {
      await createSession(sessionForm);
      toast.success(`${sessionForm.name} created`);
      setSessionForm({ name: "", start_date: "", end_date: "" });
      setNewSession(false);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleCreateTerm = async (sessionId) => {
    if (!termName.trim()) return toast.error("Enter a term name e.g. 1st Term");
    setSaving(true);
    try {
      await createTerm(sessionId, { name: termName });
      toast.success(`${termName} created`);
      setTermName("");
      setNewTermFor(null);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleOpen = async (termId, termName) => {
    try {
      await openTerm(termId);
      toast.success(`${termName} opened for result entry`);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleClose = async (termId, termName) => {
    try {
      await closeTerm(termId);
      toast.success(`${termName} closed — results locked`);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleSetCurrent = async (termId) => {
    try {
      await setCurrentTerm(termId);
      toast.success("Current term updated");
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-ink">Academic sessions & terms</h3>
          <p className="mt-0.5 text-xs text-ink/45">
            Create sessions and terms. Open a term to allow teachers to enter results. Close it to lock grades.
          </p>
        </div>
        <Button size="sm" onClick={() => setNewSession(true)}>
          <Plus size={14} /> New session
        </Button>
      </div>

      {/* New session form */}
      {newSession && (
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-ink">New academic session</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Session name"
              value={sessionForm.name}
              onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
              placeholder="e.g. 2025/2026"
              containerClassName="sm:col-span-1"
            />
            <Input
              label="Start date"
              type="date"
              value={sessionForm.start_date}
              onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
            />
            <Input
              label="End date"
              type="date"
              value={sessionForm.end_date}
              onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleCreateSession} disabled={saving}>
              {saving ? "Creating…" : "Create session"}
            </Button>
            <Button size="sm" variant="subtle" onClick={() => setNewSession(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {isLoading && <p className="text-sm text-ink/45">Loading…</p>}

      {sessions.map((sess) => (
        <Card key={sess.id} className="overflow-hidden">
          {/* Session header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-base font-semibold text-ink">{sess.name}</span>
              {sess.is_current && <Badge tone="forest">Current session</Badge>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setNewTermFor(sess.id); setTermName(""); }}
            >
              <Plus size={13} /> Add term
            </Button>
          </div>

          {/* New term form */}
          {newTermFor === sess.id && (
            <div className="flex items-end gap-2 border-b border-line bg-paper px-5 py-3">
              <Input
                label="Term name"
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                placeholder="e.g. 1st Term, 2nd Term, 3rd Term"
                containerClassName="flex-1"
              />
              <Button size="sm" onClick={() => handleCreateTerm(sess.id)} disabled={saving}>
                {saving ? "…" : "Create"}
              </Button>
              <Button size="sm" variant="subtle" onClick={() => setNewTermFor(null)}>
                Cancel
              </Button>
            </div>
          )}

          {/* Terms list */}
          <div className="divide-y divide-line">
            {(!sess.terms || sess.terms.length === 0) && (
              <p className="px-5 py-4 text-sm text-ink/40">No terms yet — click Add term.</p>
            )}
            {(sess.terms || []).map((term) => (
              <div key={term.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="flex flex-1 items-center gap-2.5">
                  <span className="text-sm font-medium text-ink">{term.name}</span>
                  {term.is_current && <Badge tone="forest">Current</Badge>}
                  {term.is_open
                    ? <Badge tone="amber">Open for entry</Badge>
                    : <Badge tone="red">Locked</Badge>
                  }
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!term.is_current && (
                    <button
                      onClick={() => handleSetCurrent(term.id)}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink/55 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 transition-colors"
                    >
                      Set as current
                    </button>
                  )}
                  {term.is_open ? (
                    <button
                      onClick={() => handleClose(term.id, term.name)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Close entry
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpen(term.id, term.name)}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      Open for entry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="rounded-xl border border-line bg-paper p-4 text-xs text-ink/50 leading-relaxed">
        <strong className="text-ink">How terms work:</strong> The <strong>current term</strong> is used for attendance, fees and announcements.
        <strong> Open for entry</strong> means teachers can enter results.
        <strong> Locked</strong> means results are frozen — teachers cannot edit, but admins can still make corrections.
        You can open old terms at any time to allow printing or corrections.
      </div>
    </div>
  );
}

/* ─── Report card templates ─── */
function TemplatesTab() {
  const { plan, templates, isLoading, mutate } = useSchoolTemplates();
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);
  const setDefaultTemplate = useStore((s) => s.setDefaultTemplate);
  const [saving, setSaving] = useState(null);
  const choose = async (key) => {
    setSaving(key);
    try { await apiSetDefault(key); setDefaultTemplate(key); mutate(); toast.success("Default template updated"); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(null); }
  };
  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle>Default report card</CardTitle><span className="text-xs text-ink/45">Plan: {plan}</span></CardHeader>
      <CardBody>
        <p className="mb-4 text-sm text-ink/55">Choose the template used for every report card. Locked templates belong to a higher plan.</p>
        {isLoading && <p className="text-sm text-ink/45">Loading templates…</p>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => {
            const available = t.available;
            const selected = defaultTemplateId === t.id;
            return (
              <button key={t.id} disabled={!available || saving === t.id} onClick={() => available && choose(t.id)}
                className={cn("rounded-xl border p-4 text-left transition-colors", selected ? "border-forest-500 ring-2 ring-forest-500/15" : "border-line", available ? "bg-white hover:bg-paper" : "cursor-not-allowed bg-paper/60 opacity-70")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{t.name}</span>
                  {available
                    ? (selected ? <span className="flex items-center gap-1 text-xs font-medium text-forest-600"><Check size={13} /> Default</span> : <span className="text-xs text-ink/40">Tap to select</span>)
                    : <span className="flex items-center gap-1 text-xs font-medium text-gold-600"><Lock size={12} /> {lowestPlanFor(t)}</span>}
                </div>
                <p className="mt-1.5 text-xs text-ink/55">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
