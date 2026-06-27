"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Save, Send, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { useClasses, useSubjects, useCurrentTerm, useResultSheet, useStudents, useReportCard, useStudentAttendance, saveResults, submitResults } from "@/lib/api";
import { getGrade, getErrorMessage } from "@/lib/utils";
import { downloadNode } from "@/lib/print";
import { resolveTemplate } from "@/lib/templates";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Select from "@/components/shared/Select";
import Badge from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";
import ReportCard from "@/components/results/ReportCard";
import ChildSwitcher, { useCurrentChild } from "@/components/parent/ChildSwitcher";

export default function ResultsPage() {
  const role = useStore((s) => s.user?.role);
  if (role === "parent") return <ParentResults />;
  return <StaffResults teacher={role === "teacher"} />;
}

/* ─── staff: score entry sheet ─── */
function StaffResults({ teacher }) {
  const { items: classes } = useClasses();
  const { items: classSubjects, isLoading: subjectsLoading } = useClassSubjects(classArmId);
  const currentTerm = useCurrentTerm(true);

  const classOptions = classes.map((c) => ({ value: String(c.id), label: c.label }));
  const subjectOptions = classSubjects.map((s) => ({ value: String(s.id), label: s.name }));

  const [classArmId, setClassArmId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const termId = currentTerm?.id ? String(currentTerm.id) : "";

  const selectedClass = classes.find((c) => String(c.id) === classArmId);

  // Fetch the class roster so the sheet always has all students, even if no
  // results have been entered yet (empty sheet is the common first-use case).
  const { items: classStudents } = useStudents(
    selectedClass ? { class: selectedClass.label, per_page: 100 } : null
  );

  // Fetch any already-saved results for this class+subject+term.
  const { items: savedSheet, isLoading, mutate } = useResultSheet({
    class_arm_id: classArmId, subject_id: subjectId, term_id: termId,
  });

  // Merge: every student in the class appears in the sheet; saved scores fill
  // in where they exist; new students start at 0.
  const baseRows = useMemo(() => {
    const savedByStudent = Object.fromEntries(savedSheet.map((r) => [r.student_id, r]));
    return classStudents.map((s) => ({
      student_id: s.id,
      student_name: s.name,
      reg_number: s.reg_number,
      ca1: savedByStudent[s.id]?.ca1 ?? 0,
      ca2: savedByStudent[s.id]?.ca2 ?? 0,
      exam: savedByStudent[s.id]?.exam ?? 0,
      status: savedByStudent[s.id]?.status ?? "draft",
    }));
  }, [classStudents, savedSheet]);

  // Local edit layer — only tracks changes since last save.
  const [edits, setEdits] = useState({});
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
      ...r, total: (Number(r.ca1) || 0) + (Number(r.ca2) || 0) + (Number(r.exam) || 0),
    }));
    const ranked = [...withT].sort((a, b) => b.total - a.total);
    const pos = {}; ranked.forEach((r, i) => (pos[r.student_id] = i + 1));
    return withT.map((r) => ({ ...r, position: pos[r.student_id] }));
  }, [merged]);

  const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  const handleSave = async () => {
    if (!classArmId || !subjectId || !termId) return toast.error("Select a class, subject and term first");
    if (computed.length === 0) return toast.error("No students in this class");
    try {
      await saveResults({
        class_arm_id: Number(classArmId), subject_id: Number(subjectId), term_id: Number(termId),
        scores: computed.map((r) => ({ student_id: r.student_id, ca1: r.ca1 ?? 0, ca2: r.ca2 ?? 0, exam: r.exam ?? 0 })),
      });
      toast.success("Draft saved"); setEdits({}); mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleSubmit = async () => {
    if (!classArmId || !subjectId || !termId) return toast.error("Select a class, subject and term first");
    try {
      await submitResults({ class_arm_id: Number(classArmId), subject_id: Number(subjectId), term_id: Number(termId) });
      toast.success("Submitted for approval"); mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const sheetReady = Boolean(classArmId && subjectId && termId);

  return (
    <div>
      <PageHeader title="Results" subtitle="Enter and review continuous assessment & exam scores">
        <Button variant="subtle" size="md" onClick={handleSave}><Save size={16} /> Save draft</Button>
        <Button size="md" onClick={handleSubmit}><Send size={16} /> Submit for approval</Button>
      </PageHeader>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select label="Class" placeholder="Select class" options={classOptions} value={classArmId}
            onChange={(e) => { setClassArmId(e.target.value); setEdits({}); }} />
          <Select
  label="Subject"
  placeholder={classArmId ? (classSubjects.length === 0 ? "No subjects assigned to this class" : "Select subject") : "Select class first"}
  options={subjectOptions}
  value={subjectId}
  onChange={(e) => { setSubjectId(e.target.value); setEdits({}); }}
  disabled={!classArmId || classSubjects.length === 0}
/>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Term</label>
            <p className="flex h-10 items-center text-sm text-ink/70">{currentTerm?.name || "—"}</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR><TH>Student</TH><TH className="text-center">CA1 (20)</TH><TH className="text-center">CA2 (20)</TH><TH className="text-center">Exam (60)</TH><TH className="text-center">Total</TH><TH className="text-center">Grade</TH><TH className="text-center">Position</TH></TR>
          </THead>
          <TBody>
            {!sheetReady && <TR><TD colSpan={7} className="py-10 text-center text-ink/45">Select a class and subject to load the score sheet.</TD></TR>}
            {sheetReady && isLoading && <TR><TD colSpan={7} className="py-10 text-center text-ink/45">Loading sheet…</TD></TR>}
            {sheetReady && !isLoading && computed.length === 0 && <TR><TD colSpan={7} className="py-10 text-center text-ink/45">No students in this class yet.</TD></TR>}
            {sheetReady && !isLoading && computed.map((r) => {
              const g = getGrade(r.total);
              return (
                <TR key={r.student_id}>
                  <TD>
                    <span className="font-medium text-ink">{r.student_name}</span>
                    <span className="block font-mono text-xs text-ink/45">{r.reg_number}</span>
                  </TD>
                  <TD className="text-center"><ScoreCell value={r.ca1 ?? ""} onChange={(v) => update(r.student_id, "ca1", v)} /></TD>
                  <TD className="text-center"><ScoreCell value={r.ca2 ?? ""} onChange={(v) => update(r.student_id, "ca2", v)} /></TD>
                  <TD className="text-center"><ScoreCell value={r.exam ?? ""} onChange={(v) => update(r.student_id, "exam", v)} /></TD>
                  <TD className="text-center font-semibold text-ink">{r.total}</TD>
                  <TD className="text-center"><Badge tone={g.color}>{g.grade}</Badge></TD>
                  <TD className="text-center text-ink/70">{ord(r.position)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
      <p className="mt-3 text-xs text-ink/45">Totals and grades recalculate live as you type. Save draft first, then submit for approval.</p>
    </div>
  );
}

function ScoreCell({ value, onChange }) {
  return (
    <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 w-16 rounded-lg border border-line bg-white text-center text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200" />
  );
}

/* ─── parent: report card view ─── */
function ParentResults() {
  const child = useCurrentChild();
  const school = useStore((s) => s.school);
  const defaultTemplateId = useStore((s) => s.defaultTemplateId);
  const currentTerm = useCurrentTerm(true);
  const ref = useRef(null);

  const { report, isLoading } = useReportCard(child?.id, currentTerm?.id);
  const { attendance } = useStudentAttendance(child?.id);

  const template = resolveTemplate(defaultTemplateId, school?.plan);

  const childForCard = useMemo(() => {
    if (!child || !report) return null;
    return {
      name: report.student?.name || child.name,
      cls: report.student?.class || child.cls,
      class_size: null,
      results: (report.subjects || []).map((s) => [s.subject, s.ca1, s.ca2, s.exam]),
      attendance: { rate: attendance?.rate ?? "—" },
      remark_teacher: "",
      remark_principal: "",
    };
  }, [child, report, attendance]);

  return (
    <div>
      <PageHeader title="Result sheet" subtitle={child ? `${child.name} · ${child.cls} · ${currentTerm?.name || ""}` : "Result sheet"}>
        {childForCard && (
          <Button variant="outline" size="md" onClick={() => downloadNode(ref.current, `${child.name} Report Card`)}>
            <Download size={16} /> Download report card
          </Button>
        )}
      </PageHeader>
      <ChildSwitcher />
      {isLoading && <Card className="p-8 text-center text-ink/45">Loading report card…</Card>}
      {!isLoading && !childForCard && <Card className="p-8 text-center text-ink/45">No results available for this term yet.</Card>}
      {!isLoading && childForCard && (
        <div className="overflow-x-auto">
          <div className="mx-auto max-w-3xl shadow-card">
            <ReportCard ref={ref} child={childForCard} base={template.base} school={school || { name: "Sembly School" }} />
          </div>
        </div>
      )}
      {template && <p className="mt-3 text-center text-xs text-ink/45">Template: {template.name}</p>}
    </div>
  );
}
