"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Save, Send, Check, Clock, AlertCircle, Printer, ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  useClasses, useResultSheet, useStudents, useReportCard,
  useStudentAttendance, useClassSubjects, useAllTerms,
  useClassReportCards, useStudentSkills,
  saveResults, submitResults, approveResults,
  saveStudentSkills, saveStudentRemarks,
} from "@/lib/api";
import { getGrade, getErrorMessage, cn } from "@/lib/utils";
import { resolveTemplate } from "@/lib/templates";
import PageHeader from "@/components/shared/PageHeader";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Select from "@/components/shared/Select";
import Badge from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";
import ReportCard from "@/components/results/ReportCard";
import ChildSwitcher, { useCurrentChild } from "@/components/parent/ChildSwitcher";
import api from "@/lib/axios";
import useSWR, { useSWRConfig } from "swr";

const fetcher = (url) => api.get(url).then((r) => r.data);

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const role = useStore((s) => s.user?.role);
  if (role === "parent") return <ParentResults />;
  return <StaffResults isAdmin={role === "school_admin"} />;
}

// ─── Staff / Admin score entry ─────────────────────────────────────────────────
function StaffResults({ isAdmin }) {
  const { mutate: globalMutate } = useSWRConfig();
  const { items: classes } = useClasses();
  const school            = useStore((s) => s.school);
  const logoUrl           = useStore((s) => s.logoUrl);
  const stampUrl          = useStore((s) => s.stampUrl);
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);

  const [classArmId, setClassArmId] = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [termId,     setTermId]     = useState("");
  const [edits,      setEdits]      = useState({});
  const [saving,     setSaving]     = useState(false);
  const [approving,  setApproving]  = useState(false);
  const [printOpen,  setPrintOpen]  = useState(false);

  const selectedClass = classes.find((c) => String(c.id) === classArmId);
  const { items: classSubjects } = useClassSubjects(classArmId || null);
  const { items: classStudents } = useStudents(
    selectedClass ? { class: selectedClass.label, per_page: 100 } : null
  );

  const sheetKey = classArmId && subjectId && termId
    ? `/results?class_arm_id=${classArmId}&subject_id=${subjectId}&term_id=${termId}`
    : null;
  const { data: sheetData, isLoading, mutate } = useSWR(sheetKey, fetcher);
  const savedSheet  = sheetData?.data || [];
  const sheetStatus = savedSheet.length > 0 ? savedSheet[0].status : null;

  const baseRows = useMemo(() => {
    const byId = Object.fromEntries(savedSheet.map((r) => [r.student_id, r]));
    return classStudents.map((s) => ({
      student_id:   s.id,
      student_name: s.name,
      reg_number:   s.reg_number,
      ca1:    byId[s.id]?.ca1  ?? 0,
      ca2:    byId[s.id]?.ca2  ?? 0,
      exam:   byId[s.id]?.exam ?? 0,
      status: byId[s.id]?.status ?? "draft",
    }));
  }, [classStudents, savedSheet]);

  const update = (studentId, field, value) => {
    const max = field === "exam" ? 60 : 20;
    const v = value === "" ? "" : Math.max(0, Math.min(max, Number(value)));
    setEdits((p) => ({ ...p, [studentId]: { ...(p[studentId] || {}), [field]: v } }));
  };

  const merged = useMemo(
    () => baseRows.map((r) => ({ ...r, ...(edits[r.student_id] || {}) })),
    [baseRows, edits]
  );

  const computed = useMemo(() => {
    const withT = merged.map((r) => ({
      ...r,
      total: (Number(r.ca1) || 0) + (Number(r.ca2) || 0) + (Number(r.exam) || 0),
    }));
    const ranked = [...withT].sort((a, b) => b.total - a.total);
    const pos = {};
    ranked.forEach((r, i) => (pos[r.student_id] = i + 1));
    return withT.map((r) => ({ ...r, position: pos[r.student_id] }));
  }, [merged]);

  const hasEdits    = Object.keys(edits).length > 0;
  const sheetReady  = Boolean(classArmId && subjectId && termId);

  const ord = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const doSave = async () => {
    if (!classArmId || !subjectId || !termId) {
      toast.error("Select a class, subject and term first");
      return false;
    }
    if (computed.length === 0) { toast.error("No students in this class"); return false; }
    await saveResults({
      class_arm_id: Number(classArmId),
      subject_id:   Number(subjectId),
      term_id:      Number(termId),
      scores: computed.map((r) => ({
        student_id: r.student_id,
        ca1:  r.ca1  ?? 0,
        ca2:  r.ca2  ?? 0,
        exam: r.exam ?? 0,
      })),
    });
    setEdits({});
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await doSave();
      if (ok) { toast.success("Scores saved"); await mutate(); }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleSubmitForApproval = async () => {
    if (!sheetReady) return toast.error("Select class, subject and term first");
    try {
      if (hasEdits) { const ok = await doSave(); if (!ok) return; }
      await submitResults({
        class_arm_id: Number(classArmId),
        subject_id:   Number(subjectId),
        term_id:      Number(termId),
      });
      toast.success("Submitted for approval");
      await mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleApprove = async () => {
    if (!sheetReady) return toast.error("Select class, subject and term first");
    setApproving(true);
    try {
      if (hasEdits) { await doSave(); }
      await approveResults({
        class_arm_id: Number(classArmId),
        subject_id:   Number(subjectId),
        term_id:      Number(termId),
      });
      toast.success("Results approved and locked");
      await mutate(undefined, { revalidate: true });
      await globalMutate("/results/pending");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setApproving(false); }
  };

  const schoolWithBrand = {
    ...(school || { name: "School" }),
    logo_url:  logoUrl,
    stamp_url: stampUrl,
  };

  return (
    <div>
      <PageHeader
        title="Results"
        subtitle={isAdmin
          ? "Review, enter and approve result sheets"
          : "Enter scores for your assigned classes"
        }
      >
        <Button variant="subtle" size="md" onClick={handleSave} disabled={!sheetReady || saving}>
          <Save size={16} /> {saving ? "Saving…" : "Save draft"}
        </Button>
        {isAdmin ? (
          <>
            <Button
              size="md"
              onClick={handleApprove}
              disabled={!sheetReady || computed.length === 0 || approving}
            >
              <Check size={16} /> {approving ? "Approving…" : "Approve results"}
            </Button>
            <Button
              variant="outline" size="md"
              onClick={() => setPrintOpen(true)}
              disabled={!classArmId || !termId}
            >
              <Printer size={16} /> Print cards
            </Button>
          </>
        ) : (
          <Button
            size="md"
            onClick={handleSubmitForApproval}
            disabled={!sheetReady || computed.length === 0}
          >
            <Send size={16} /> Submit for approval
          </Button>
        )}
      </PageHeader>

      {isAdmin && <PendingApprovalsPanel />}

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Class"
            placeholder="Select class"
            options={classes.map((c) => ({ value: String(c.id), label: c.label }))}
            value={classArmId}
            onChange={(e) => { setClassArmId(e.target.value); setSubjectId(""); setEdits({}); }}
          />
          <Select
            label="Subject"
            placeholder={
              !classArmId                ? "Select class first" :
              classSubjects.length === 0 ? "No subjects in this class" :
                                           "Select subject"
            }
            options={classSubjects.map((s) => ({ value: String(s.id), label: s.name }))}
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); setEdits({}); }}
            disabled={!classArmId || classSubjects.length === 0}
          />
          <TermSelector
            termId={termId}
            onChange={(val) => { setTermId(val); setEdits({}); }}
            isAdmin={isAdmin}
          />
        </div>
      </Card>

      {/* Status banners */}
      {sheetReady && sheetStatus && !hasEdits && (
        <SheetStatusBanner status={sheetStatus} isAdmin={isAdmin} />
      )}
      {hasEdits && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle size={15} />
          <span>You have unsaved changes. Save before {isAdmin ? "approving" : "submitting"}.</span>
        </div>
      )}

      {/* Score sheet */}
      <Card className="overflow-hidden mb-4">
        <Table>
          <THead>
            <TR>
              <TH>Student</TH>
              <TH className="text-center">CA1 (20)</TH>
              <TH className="text-center">CA2 (20)</TH>
              <TH className="text-center">Exam (60)</TH>
              <TH className="text-center">Total</TH>
              <TH className="text-center">Grade</TH>
              <TH className="text-center">Position</TH>
            </TR>
          </THead>
          <TBody>
            {!sheetReady && (
              <TR><TD colSpan={7} className="py-10 text-center text-ink/45">
                Select a class, subject and term to load the score sheet.
              </TD></TR>
            )}
            {sheetReady && isLoading && (
              <TR><TD colSpan={7} className="py-10 text-center text-ink/45">Loading…</TD></TR>
            )}
            {sheetReady && !isLoading && computed.length === 0 && (
              <TR><TD colSpan={7} className="py-10 text-center text-ink/45">
                No students in this class yet.
              </TD></TR>
            )}
            {sheetReady && !isLoading && computed.map((r) => {
              const g = getGrade(r.total);
              return (
                <TR key={r.student_id}>
                  <TD>
                    <span className="font-medium text-ink">{r.student_name}</span>
                    <span className="block font-mono text-xs text-ink/45">{r.reg_number}</span>
                  </TD>
                  <TD className="text-center">
                    <ScoreCell value={r.ca1 ?? ""} onChange={(v) => update(r.student_id, "ca1", v)} />
                  </TD>
                  <TD className="text-center">
                    <ScoreCell value={r.ca2 ?? ""} onChange={(v) => update(r.student_id, "ca2", v)} />
                  </TD>
                  <TD className="text-center">
                    <ScoreCell value={r.exam ?? ""} onChange={(v) => update(r.student_id, "exam", v)} />
                  </TD>
                  <TD className="text-center font-semibold text-ink">{r.total}</TD>
                  <TD className="text-center"><Badge tone={g.color}>{g.grade}</Badge></TD>
                  <TD className="text-center text-ink/70">{ord(r.position)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      {/* 3rd term cumulative preview — admin only */}
      {isAdmin && classArmId && termId && (
        <ThirdTermPreview
          classArmId={classArmId}
          termId={termId}
          school={schoolWithBrand}
        />
      )}

      {/* Skills and remarks entry */}
      {classArmId && termId && (
        <SkillsEntrySection
          classArmId={classArmId}
          termId={termId}
          isAdmin={isAdmin}
          classes={classes}
        />
      )}

      <p className="mt-3 text-xs text-ink/45">
        {isAdmin
          ? "Approving saves current scores and locks the sheet. Parents can see approved results."
          : "Totals recalculate as you type. Save first, then submit for approval."
        }
      </p>

      {isAdmin && printOpen && (
        <PrintModal
          classArmId={classArmId}
          termId={termId}
          school={schoolWithBrand}
          defaultTemplateId={defaultTemplateId}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Sheet status banner ──────────────────────────────────────────────────────
function SheetStatusBanner({ status, isAdmin }) {
  const map = {
    draft: {
      icon: <Clock size={15} />,
      text: isAdmin ? "Draft — scores saved but not approved yet." : "Draft — submit for approval when ready.",
      cls: "border-line bg-paper text-ink/60",
    },
    submitted: {
      icon: <AlertCircle size={15} />,
      text: isAdmin ? "Submitted by the teacher — waiting for your approval." : "Submitted — the admin will review and approve.",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    },
    approved: {
      icon: <Check size={15} />,
      text: "Approved — results are locked and visible on report cards.",
      cls: "border-green-200 bg-green-50 text-green-700",
    },
  };
  const c = map[status];
  if (!c) return null;
  return (
    <div className={cn("mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm", c.cls)}>
      {c.icon}<span>{c.text}</span>
    </div>
  );
}

// ─── Pending approvals panel ──────────────────────────────────────────────────
function PendingApprovalsPanel() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, mutate } = useSWR("/results/pending", fetcher);
  const pending = data?.data || [];

  const handleApprove = async (p) => {
    try {
      await approveResults({ class_arm_id: p.class_arm_id, subject_id: p.subject_id, term_id: p.term_id });
      toast.success(`${p.class_label} — ${p.subject_name} approved`);
      await mutate();
      await globalMutate(
        (key) => typeof key === "string" && key.startsWith("/results?"),
        undefined,
        { revalidate: true }
      );
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (pending.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
            {pending.length}
          </span>
          <CardTitle>Pending approvals</CardTitle>
        </div>
        <span className="text-xs text-ink/45">Teachers have submitted these for review</span>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-line">
          {pending.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{p.class_label} — {p.subject_name}</p>
                <p className="text-xs text-ink/45">{p.term_name} · {p.student_count} students · by {p.teacher_name}</p>
              </div>
              <Button size="sm" onClick={() => handleApprove(p)}>
                <Check size={13} /> Approve
              </Button>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Term selector ────────────────────────────────────────────────────────────
function TermSelector({ termId, onChange, isAdmin }) {
  const allTerms = useAllTerms();
  const available = isAdmin ? allTerms : allTerms.filter((t) => t.is_open);

  if (!isAdmin && available.length === 0) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Term</label>
        <p className="flex h-10 items-center text-xs text-amber-600">
          No term is open for entry. Contact the school admin.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink/70">
        Term
        {!isAdmin && <span className="ml-1.5 text-[10px] font-normal text-amber-600">(open terms only)</span>}
      </label>
      <select
        value={termId}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200"
      >
        <option value="">Select term…</option>
        {available.map((t) => (
          <option key={t.id} value={String(t.id)}>
            {t.session_name} — {t.name}
            {t.is_open ? " (open)" : " (locked)"}
            {t.is_current ? " ✓" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── 3rd term cumulative preview ──────────────────────────────────────────────
function ThirdTermPreview({ classArmId, termId, school }) {
  const { report, isLoading } = useClassReportCards(classArmId, termId);
  const [selectedId, setSelectedId] = useState(null);

  const isThirdTerm = report?.term?.is_third_term;
  const students    = report?.students || [];
  const schoolData  = { ...(school || {}), ...(report?.school || {}) };
  const termLabel   = report?.term ? `${report.term.session} — ${report.term.name}` : "";

  if (!isLoading && !isThirdTerm) return null;

  if (isLoading) {
    return (
      <div className="mt-2 rounded-xl border border-line bg-paper px-5 py-3 text-sm text-ink/45">
        Checking for cumulative data…
      </div>
    );
  }

  const selected = students.find((s) => s.student.id === selectedId);

  const buildChild = (s) => ({
    name:               s.student.name,
    cls:                s.student.class,
    reg_number:         s.student.reg_number,
    gender:             s.student.gender,
    class_size:         students.length,
    summary:            { average: s.average, cumulative_average: s.cumulative_average, is_third_term: true },
    is_third_term:      true,
    cumulative_average: s.cumulative_average,
    skills:             s.skills || null,
    remarks:            s.remarks || null,
    attendance:         s.attendance || { days_opened: "—", days_present: "—", days_absent: "—" },
    results: s.subjects.map((r) => ({
      subject: r.subject, ca1: r.ca1, ca2: r.ca2, exam: r.exam,
      total: r.total, grade: r.grade, position: r.position,
      highest: r.highest, lowest: r.lowest, class_avg: r.class_avg,
      cumulative: r.cumulative, term_totals: r.term_totals,
    })),
    remark_teacher:   s.remarks?.teacher_remark   || "",
    remark_principal: s.remarks?.principal_remark || "",
    next_term_begins: s.remarks?.next_term_begins || "",
  });

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <Check size={15} />
        <span>
          <strong>3rd term detected.</strong> Report cards below include 1st, 2nd &amp; 3rd term scores with cumulative averages.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <div className="p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">Select student to preview</p>
            {students.length === 0 && (
              <p className="py-4 text-center text-xs text-ink/45">No approved results yet.<br />Approve results first.</p>
            )}
            {students.map((s) => (
              <button
                key={s.student.id}
                onClick={() => setSelectedId(selectedId === s.student.id ? null : s.student.id)}
                className={cn(
                  "mb-1 w-full rounded-lg px-3 py-2 text-left transition-colors",
                  selectedId === s.student.id ? "bg-forest-600 text-white" : "text-ink hover:bg-paper"
                )}
              >
                <p className="text-sm font-medium leading-tight">{s.student.name}</p>
                <p className={cn("mt-0.5 text-xs", selectedId === s.student.id ? "text-white/70" : "text-ink/45")}>
                  Avg {s.average}{s.cumulative_average !== null && ` · Cum. ${s.cumulative_average}`}
                </p>
              </button>
            ))}
          </div>
        </Card>
        <div>
          {!selected && (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink/40">
              Click a student to preview their 3-term report card
            </div>
          )}
          {selected && (
            <div className="overflow-x-auto rounded-xl shadow-md">
              <ReportCard child={buildChild(selected)} school={schoolData} term={termLabel} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Print modal ──────────────────────────────────────────────────────────────
function PrintModal({ classArmId, termId, school, defaultTemplateId, onClose }) {
  const { report, isLoading } = useClassReportCards(classArmId, termId);
  const [selId, setSelId] = useState(null);
  const cardRef = useRef(null);

  const students    = report?.students || [];
  const schoolData  = { ...(school || {}), ...(report?.school || {}) };
  const termLabel   = report?.term ? `${report.term.session} — ${report.term.name}` : "";
  const isThirdTerm = report?.term?.is_third_term || false;

  const buildChild = (s) => ({
    name:               s.student.name,
    cls:                s.student.class,
    reg_number:         s.student.reg_number,
    gender:             s.student.gender,
    class_size:         students.length,
    is_third_term:      isThirdTerm,
    cumulative_average: s.cumulative_average,
    summary: {
      total_score:        s.subjects.reduce((acc, r) => acc + (r.total || 0), 0),
      obtainable:         s.subjects.length * 100,
      average:            s.average,
      cumulative_average: s.cumulative_average,
      is_third_term:      isThirdTerm,
      position:           null,
      class_size:         students.length,
    },
    skills:   s.skills   || null,
    remarks:  s.remarks  || null,
    attendance: s.attendance || { days_opened: "—", days_present: "—", days_absent: "—" },
    results: s.subjects.map((r) => ({
      subject: r.subject, ca1: r.ca1, ca2: r.ca2, exam: r.exam,
      total: r.total, grade: r.grade, position: r.position,
      highest: r.highest, lowest: r.lowest, class_avg: r.class_avg,
      remark: r.remark, cumulative: r.cumulative, term_totals: r.term_totals,
    })),
    remark_teacher:   s.remarks?.teacher_remark   || "",
    remark_principal: s.remarks?.principal_remark || "",
    next_term_begins: s.remarks?.next_term_begins || "",
  });

  const doPrint = (html, title) => {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>* { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }
      .page { page-break-after: always; } .page:last-child { page-break-after: avoid; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const printOne = () => {
    if (!cardRef.current) return;
    const sel = students.find((s) => s.student.id === selId);
    if (!sel) return toast.error("Select a student first");
    doPrint(cardRef.current.innerHTML, `${sel.student.name} — ${termLabel}`);
  };

  const printAll = () => {
    if (!cardRef.current) return;
    doPrint(cardRef.current.innerHTML, `${report?.class} Report Cards — ${termLabel}`);
  };

  const selected = students.find((s) => s.student.id === selId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="h-5 w-px bg-line" />
          <div>
            <h2 className="font-display text-lg text-ink">{report?.class || "—"} Report Cards</h2>
            <p className="text-xs text-ink/45">
              {termLabel} · {students.length} students
              {isThirdTerm && " · includes cumulative averages"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <span className="text-sm text-ink/45">Loading…</span>}
          {!isLoading && selId && (
            <Button size="sm" onClick={printOne}><Printer size={14} /> Print selected</Button>
          )}
          {!isLoading && students.length > 0 && (
            <Button size="sm" variant={selId ? "outline" : "primary"} onClick={printAll}>
              <Printer size={14} /> Print all ({students.length})
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Student list */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-line bg-paper">
          <div className="p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
              Students ({students.length})
            </p>
            {isLoading && <p className="py-6 text-center text-xs text-ink/45">Loading…</p>}
            {!isLoading && students.length === 0 && (
              <p className="py-6 text-center text-xs text-ink/45">No approved results found.<br />Approve results first.</p>
            )}
            {students.map((s) => (
              <button
                key={s.student.id}
                onClick={() => setSelId(selId === s.student.id ? null : s.student.id)}
                className={cn(
                  "mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                  selId === s.student.id ? "bg-forest-600 text-white" : "text-ink hover:bg-line"
                )}
              >
                <p className="text-sm font-medium leading-tight">{s.student.name}</p>
                <p className={cn("mt-0.5 text-xs", selId === s.student.id ? "text-white/70" : "text-ink/45")}>
                  {s.student.reg_number || "—"} · Avg {s.average}
                  {isThirdTerm && s.cumulative_average !== null && ` · Cum. ${s.cumulative_average}`}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {!selId && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Printer size={36} className="text-ink/20" />
              <p className="text-sm text-ink/50">Select a student to preview their report card</p>
              <p className="text-xs text-ink/35">or click Print all to send everyone to the printer</p>
            </div>
          )}

          {/* Visible preview */}
          {selected && (
            <div className="mx-auto max-w-3xl shadow-xl">
              <ReportCard child={buildChild(selected)} school={schoolData} term={termLabel} />
            </div>
          )}

          {/* Hidden print area — single student */}
          {selected && (
            <div ref={cardRef} style={{ display: "none" }}>
              <ReportCard child={buildChild(selected)} school={schoolData} term={termLabel} />
            </div>
          )}

          {/* Hidden print area — all students */}
          {!selected && students.length > 0 && (
            <div ref={cardRef} style={{ display: "none" }}>
              {students.map((s) => (
                <div key={s.student.id} className="page">
                  <ReportCard child={buildChild(s)} school={schoolData} term={termLabel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skills entry section ─────────────────────────────────────────────────────
function SkillsEntrySection({ classArmId, termId, isAdmin, classes }) {
  const { items: classStudents } = useStudents(
    classArmId
      ? { class: classes.find((c) => String(c.id) === classArmId)?.label, per_page: 100 }
      : null
  );
  const [selectedStudent, setSelectedStudent] = useState(null);

  if (!classStudents.length) return null;

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Student profiles — affective &amp; psychomotor skills</CardTitle>
          <span className="text-xs text-ink/45">
            Select a student to fill their skills ratings and remarks for this term
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
            <div className="border-r border-line">
              <div className="p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                  {classStudents.length} students
                </p>
                {classStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(selectedStudent?.id === s.id ? null : s)}
                    className={cn(
                      "mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selectedStudent?.id === s.id
                        ? "bg-forest-600 text-white"
                        : "text-ink hover:bg-paper"
                    )}
                  >
                    <p className="font-medium leading-tight">{s.name}</p>
                    <p className={cn("text-xs mt-0.5", selectedStudent?.id === s.id ? "text-white/70" : "text-ink/45")}>
                      {s.reg_number || "—"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {!selectedStudent && (
                <div className="flex h-40 items-center justify-center text-sm text-ink/40">
                  Select a student to fill their skills and remarks
                </div>
              )}
              {selectedStudent && (
                <SkillsForm student={selectedStudent} termId={termId} isAdmin={isAdmin} />
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Skills form ──────────────────────────────────────────────────────────────
function SkillsForm({ student, termId, isAdmin }) {
  const { skills, remarks, isLoading, mutate } = useStudentSkills(student.id, termId);
  const [saving, setSaving] = useState(false);
  const [skillForm,  setSkillForm]  = useState({});
  const [remarkForm, setRemarkForm] = useState({
    teacher_remark: "", principal_remark: "", next_term_begins: "",
  });

  // Populate when data loads
  useMemo(() => {
    if (skills)  setSkillForm(skills);
    if (remarks) setRemarkForm({
      teacher_remark:   remarks.teacher_remark   || "",
      principal_remark: remarks.principal_remark || "",
      next_term_begins: remarks.next_term_begins || "",
    });
  }, [skills, remarks]);

  const AFFECTIVE = [
    ["punctuality","Punctuality"],["neatness","Neatness"],["politeness","Politeness"],
    ["honesty","Honesty"],["reliability","Reliability"],["leadership","Leadership"],
    ["cooperation","Cooperation"],["self_control","Self Control"],
    ["responsibility","Responsibility"],["initiative","Initiative"],
    ["perseverance","Perseverance"],["attentiveness","Attentiveness"],
  ];
  const PSYCHOMOTOR = [
    ["handwriting","Handwriting"],["verbal_fluency","Verbal Fluency"],
    ["sports","Sports"],["artistic_creativity","Artistic Creativity"],
    ["handling_tools","Handling Tools"],["drawing_painting","Drawing & Painting"],
  ];

  const setSkill = (key, val) => setSkillForm((p) => ({ ...p, [key]: Number(val) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveStudentSkills(student.id, { term_id: Number(termId), ...skillForm });
      await saveStudentRemarks(student.id, { term_id: Number(termId), ...remarkForm });
      toast.success(`${student.name.split(" ")[0]}'s profile saved`);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const RatingPicker = ({ fieldKey, label }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-line last:border-0">
      <span className="text-sm text-ink/70">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSkill(fieldKey, n)}
            className={cn(
              "h-7 w-7 rounded text-xs font-semibold transition-colors",
              (skillForm[fieldKey] || 0) === n
                ? "bg-forest-600 text-white"
                : "bg-paper border border-line text-ink/50 hover:border-forest-400 hover:text-forest-600"
            )}
          >
            {n}
          </button>
        ))}
        {(skillForm[fieldKey] > 0) && (
          <span className="ml-1 text-xs text-ink/40 w-14">
            {["", "Poor", "Fair", "Good", "V.Good", "Excellent"][skillForm[fieldKey] || 0]}
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading) return <p className="text-sm text-ink/45">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-ink">{student.name}</h3>
          <p className="text-xs text-ink/45">{student.reg_number} · {student.class_label}</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Check size={14} /> {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Affective domain */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
            Affective domain (1 = Poor · 5 = Excellent)
          </p>
          <div className="rounded-xl border border-line bg-paper px-4 py-2">
            {AFFECTIVE.map(([key, label]) => (
              <RatingPicker key={key} fieldKey={key} label={label} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Psychomotor */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
              Psychomotor skills
            </p>
            <div className="rounded-xl border border-line bg-paper px-4 py-2">
              {PSYCHOMOTOR.map(([key, label]) => (
                <RatingPicker key={key} fieldKey={key} label={label} />
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
              Remarks
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">Class teacher's remark</label>
                <textarea
                  value={remarkForm.teacher_remark}
                  onChange={(e) => setRemarkForm((p) => ({ ...p, teacher_remark: e.target.value }))}
                  rows={2}
                  placeholder="e.g. A very promising student. Keep it up!"
                  className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/30 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none"
                />
              </div>
              {isAdmin && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink/60">Principal's remark</label>
                    <textarea
                      value={remarkForm.principal_remark}
                      onChange={(e) => setRemarkForm((p) => ({ ...p, principal_remark: e.target.value }))}
                      rows={2}
                      placeholder="e.g. Excellent performance. Continue to strive."
                      className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/30 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink/60">Next term begins</label>
                    <input
                      type="date"
                      value={remarkForm.next_term_begins}
                      onChange={(e) => setRemarkForm((p) => ({ ...p, next_term_begins: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score input cell ─────────────────────────────────────────────────────────
function ScoreCell({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-16 rounded-lg border border-line bg-white text-center text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200"
    />
  );
}

// ─── Parent report card view ──────────────────────────────────────────────────
function ParentResults() {
  const child             = useCurrentChild();
  const school            = useStore((s) => s.school);
  const logoUrl           = useStore((s) => s.logoUrl);
  const stampUrl          = useStore((s) => s.stampUrl);
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);
  const ref               = useRef(null);

  const { data: termData } = useSWR("/sessions", fetcher);
  const currentTerm = useMemo(() => {
    const sessions = termData?.data || [];
    for (const s of sessions) {
      const t = (s.terms || []).find((t) => t.is_current);
      if (t) return t;
    }
    return null;
  }, [termData]);

  const { data: reportData, isLoading } = useSWR(
    child?.id && currentTerm?.id
      ? `/students/${child.id}/report-card?term_id=${currentTerm.id}`
      : null,
    fetcher
  );
  const report = reportData?.data || null;

  const { data: attData } = useSWR(
    child?.id ? `/students/${child.id}/attendance` : null,
    fetcher
  );
  const attendance = attData?.data || null;

  const template  = resolveTemplate(defaultTemplateId, school?.plan);
  const termLabel = currentTerm?.name || "";

  const childForCard = useMemo(() => {
    if (!child || !report) return null;
    return {
      name:               report.student?.name       || child.name,
      cls:                report.student?.class      || child.cls,
      reg_number:         report.student?.reg_number || child.reg_number,
      gender:             report.student?.gender,
      is_third_term:      report.summary?.is_third_term || false,
      cumulative_average: report.summary?.cumulative_average ?? null,
      summary:            report.summary,
      class_info:         report.class,
      skills:             report.skills  || null,
      remarks:            report.remarks || null,
      attendance:         report.attendance || { rate: attendance?.rate ?? "—" },
      results: (report.subjects || []).map((s) => ({
        subject:     s.subject,
        ca1:         s.ca1,
        ca2:         s.ca2,
        exam:        s.exam,
        total:       s.total,
        grade:       s.grade,
        remark:      s.remark,
        position:    s.position,
        highest:     s.highest,
        lowest:      s.lowest,
        class_avg:   s.class_avg,
        cumulative:  s.cumulative  ?? null,
        term_totals: s.term_totals ?? null,
      })),
      remark_teacher:   report.remarks?.teacher_remark   || "",
      remark_principal: report.remarks?.principal_remark || "",
      next_term_begins: report.remarks?.next_term_begins || "",
    };
  }, [child, report, attendance]);

  const handlePrint = () => {
    if (!ref.current) return;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${child?.name} Report Card</title>
      <style>* { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${ref.current.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const schoolWithBrand = {
    ...(school || { name: "School" }),
    logo_url:  logoUrl,
    stamp_url: stampUrl,
  };

  return (
    <div>
      <PageHeader
        title="Result sheet"
        subtitle={child ? `${child.name} · ${child.cls} · ${termLabel}` : "Result sheet"}
      >
        {childForCard && (
          <Button variant="outline" size="md" onClick={handlePrint}>
            <Printer size={16} /> Print report card
          </Button>
        )}
      </PageHeader>
      <ChildSwitcher />
      {isLoading && <Card className="p-8 text-center text-ink/45">Loading report card…</Card>}
      {!isLoading && !childForCard && (
        <Card className="p-8 text-center text-ink/45">
          No approved results available for this term yet.
        </Card>
      )}
      {!isLoading && childForCard && (
        <div className="overflow-x-auto">
          <div className="mx-auto max-w-3xl shadow-card">
            <ReportCard
              ref={ref}
              child={childForCard}
              school={schoolWithBrand}
              term={termLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
