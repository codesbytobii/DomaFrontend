"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, Clock, X, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { useClasses, useStudents, useStudentAttendance, markAttendance } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Select from "@/components/shared/Select";
import Badge from "@/components/shared/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";
import ChildSwitcher, { useCurrentChild } from "@/components/parent/ChildSwitcher";

export default function AttendancePage() {
  const role = useStore((s) => s.user?.role);
  if (role === "parent") return <ParentAttendance />;
  return <MarkAttendancePage teacher={role === "teacher"} />;
}

function MarkAttendancePage({ teacher }) {
  const { items: classes } = useClasses();
  const classOptions = classes.map((c) => ({ value: String(c.id), label: c.label }));
  const [classArmId, setClassArmId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find((c) => String(c.id) === classArmId);
  // Only fetch once a class is actually selected — avoids loading all students unnecessarily.
  const { items: students, isLoading } = useStudents(
    selectedClass ? { class: selectedClass.label, per_page: 100 } : null
  );

  const statusFor = (id) => marks[id] || "present";
  const setStatus = (id, st) => setMarks((p) => ({ ...p, [id]: st }));
  const counts = useMemo(() => students.reduce((a, s) => { const v = statusFor(s.id); a[v] = (a[v] || 0) + 1; return a; }, {}), [students, marks]);

  const handleSave = async () => {
    if (!classArmId) return toast.error("Select a class first");
    setSaving(true);
    try {
      await markAttendance({ class_arm_id: Number(classArmId), date, marks: students.map((s) => ({ student_id: s.id, status: statusFor(s.id) })) });
      toast.success("Attendance saved");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Tap to mark each student — defaults to present">
        <Button size="md" onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save"}</Button>
      </PageHeader>
      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
        <Select label="Class" placeholder="Select class" options={classOptions} value={classArmId} onChange={(e) => { setClassArmId(e.target.value); setMarks({}); }} containerClassName="sm:w-48" />
        <div><label className="mb-1.5 block text-sm font-medium text-ink/70">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-line px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest-300" /></div>
        <div className="ml-auto flex gap-2 text-xs">
          <span className="rounded-lg bg-forest-50 px-2.5 py-1.5 font-medium text-forest-700">{counts.present || 0} present</span>
          <span className="rounded-lg bg-gold-50 px-2.5 py-1.5 font-medium text-gold-600">{counts.late || 0} late</span>
          <span className="rounded-lg bg-red-50 px-2.5 py-1.5 font-medium text-red-700">{counts.absent || 0} absent</span>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <THead><TR><TH>Student</TH><TH className="text-right">Status</TH></TR></THead>
          <TBody>
            {isLoading && <TR><TD colSpan={2} className="py-8 text-center text-ink/45">Loading students…</TD></TR>}
            {!classArmId && !isLoading && <TR><TD colSpan={2} className="py-8 text-center text-ink/45">Select a class to begin.</TD></TR>}
            {students.map((s) => {
              const st = statusFor(s.id);
              return (
                <TR key={s.id}>
                  <TD><span className="font-medium text-ink">{s.name}</span><span className="block font-mono text-xs text-ink/45">{s.reg_number}</span></TD>
                  <TD>
                    <div className="flex justify-end gap-1.5">
                      <Toggle active={st === "present"} tone="forest" onClick={() => setStatus(s.id, "present")}><Check size={14} /> Present</Toggle>
                      <Toggle active={st === "late"} tone="gold" onClick={() => setStatus(s.id, "late")}><Clock size={14} /> Late</Toggle>
                      <Toggle active={st === "absent"} tone="red" onClick={() => setStatus(s.id, "absent")}><X size={14} /> Absent</Toggle>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function Toggle({ active, tone, children, onClick }) {
  const tones = { forest: "bg-forest-500 text-white border-forest-500", gold: "bg-gold-400 text-ink border-gold-400", red: "bg-red-600 text-white border-red-600" };
  return <button onClick={onClick} className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold", active ? tones[tone] : "border-line bg-white text-ink/55 hover:bg-paper")}>{children}</button>;
}

function ParentAttendance() {
  const child = useCurrentChild();
  const { attendance, isLoading } = useStudentAttendance(child?.id);
  const toneFor = (s) => s === "present" ? "forest" : s === "late" ? "gold" : "red";

  return (
    <div>
      <PageHeader title="Attendance" subtitle={child ? `${child.name} · recent` : "Attendance"} />
      <ChildSwitcher />
      {isLoading && <Card className="p-8 text-center text-ink/45">Loading…</Card>}
      {!isLoading && attendance && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Card className="p-5"><p className="text-sm text-ink/55">Rate</p><p className="mt-1 font-display text-2xl text-forest-600">{attendance.rate}%</p></Card>
            <Card className="p-5"><p className="text-sm text-ink/55">Present</p><p className="mt-1 font-display text-2xl text-ink">{attendance.present}</p></Card>
            <Card className="p-5"><p className="text-sm text-ink/55">Late</p><p className="mt-1 font-display text-2xl text-gold-500">{attendance.late}</p></Card>
            <Card className="p-5"><p className="text-sm text-ink/55">Absent</p><p className="mt-1 font-display text-2xl text-red-600">{attendance.absent}</p></Card>
          </div>
          <Card className="mt-4 overflow-hidden">
            <div className="border-b border-line px-5 py-3 font-display font-semibold">Recent days</div>
            <Table><TBody>
              {(attendance.log || []).map(([day, status], i) => (
                <TR key={i}><TD>{day}</TD><TD className="text-right"><Badge tone={toneFor(status.toLowerCase())}>{status}</Badge></TD></TR>
              ))}
            </TBody></Table>
          </Card>
        </>
      )}
      {!isLoading && !attendance && <Card className="p-8 text-center text-ink/45">No attendance records found.</Card>}
    </div>
  );
}
