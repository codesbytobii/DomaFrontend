"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTenantPath } from "@/lib/tenant";
import { useClasses, useSubjects, useClassSubjects, createClass, updateClass, addSubjectToClass, removeSubjectFromClass } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Badge from "@/components/shared/Badge";
import Modal from "@/components/shared/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

export default function ClassesPage() {
  const role = useStore((s) => s.user?.role);
  if (role === "teacher") return <TeacherClasses />;
  return <AdminClasses />;
}

/* ─── Teacher view ─── */
function TeacherClasses() {
  const { items: classes, isLoading } = useClasses();
  const user = useStore((s) => s.user);
  return (
    <div>
      <PageHeader title="My classes" subtitle="Classes you are assigned to" />
      {isLoading && <p className="text-sm text-ink/45">Loading…</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl text-ink">{c.label}</span>
              <Badge tone={c.form_teacher_id === user?.id ? "forest" : "gold"}>
                {c.form_teacher_id === user?.id ? "Form teacher" : "Subject"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-ink/55">{c.students ?? 0} students</p>
          </Card>
        ))}
        {!isLoading && classes.length === 0 && (
          <p className="text-sm text-ink/45 col-span-3">No classes assigned yet.</p>
        )}
      </div>
    </div>
  );
}

/* ─── Admin view ─── */
function AdminClasses() {
  const { items: classes, isLoading, mutate } = useClasses();
  const [classModal, setClassModal] = useState(undefined);
  const [subjectPanel, setSubjectPanel] = useState(null); // selected class for subject management

  return (
    <div>
      <PageHeader title="Classes & arms" subtitle="Set up classes and assign their subjects">
        <Button onClick={() => setClassModal(null)}><Plus size={16} /> Add class</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Class list */}
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Class</TH><TH>Level</TH><TH className="text-right">Students</TH>
                <TH className="text-right">Subjects</TH><TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading && (
                <TR><TD colSpan={5} className="py-8 text-center text-ink/45">Loading…</TD></TR>
              )}
              {classes.map((c) => (
                <TR key={c.id}
                  className={cn("cursor-pointer transition-colors", subjectPanel?.id === c.id ? "bg-forest-50" : "")}>
                  <TD className="font-medium text-ink">{c.label}</TD>
                  <TD><Badge tone={c.level === "Junior" ? "forest" : "gold"}>{c.level}</Badge></TD>
                  <TD className="text-right">{c.students ?? 0}</TD>
                  <TD className="text-right">
                    <button onClick={() => setSubjectPanel(subjectPanel?.id === c.id ? null : c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink/60 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 transition-colors">
                      <BookOpen size={13} /> Manage subjects
                    </button>
                  </TD>
                  <TD className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setClassModal(c)}>Edit</Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        {/* Subject panel — shows when a class is selected */}
        {subjectPanel && (
          <SubjectPanel cls={subjectPanel} onClose={() => setSubjectPanel(null)} />
        )}
      </div>

      <ClassFormModal
        key={classModal === undefined ? "closed" : classModal?.id || "new"}
        open={classModal !== undefined}
        initial={classModal}
        onClose={() => setClassModal(undefined)}
        onSaved={() => { mutate(); setClassModal(undefined); }}
      />
    </div>
  );
}

/* ─── Subject panel for a class ─── */
function SubjectPanel({ cls, onClose }) {
  const { items: classSubjects, isLoading, mutate } = useClassSubjects(cls.id);
  const { items: allSubjects } = useSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [adding, setAdding] = useState(false);

  // Subjects not yet assigned to this class
  const assignedIds = new Set(classSubjects.map((s) => s.id));
  const available = allSubjects.filter((s) => !assignedIds.has(s.id));

  const handleAdd = async () => {
    if (!selectedSubjectId) return toast.error("Select a subject to add");
    setAdding(true);
    try {
      await addSubjectToClass(cls.id, Number(selectedSubjectId));
      toast.success("Subject added");
      setSelectedSubjectId("");
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAdding(false); }
  };

  const handleRemove = async (subjectId, subjectName) => {
    try {
      await removeSubjectFromClass(cls.id, subjectId);
      toast.success(`${subjectName} removed`);
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <div>
          <CardTitle>Subjects — {cls.label}</CardTitle>
          <p className="mt-0.5 text-xs text-ink/45">{cls.level} · {cls.students ?? 0} students</p>
        </div>
        <button onClick={onClose} className="text-ink/40 hover:text-ink"><X size={16} /></button>
      </CardHeader>
      <CardBody className="space-y-4">

        {/* Assigned subjects */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/40">
            Assigned subjects ({classSubjects.length})
          </p>
          {isLoading && <p className="text-sm text-ink/45">Loading…</p>}
          {!isLoading && classSubjects.length === 0 && (
            <p className="rounded-xl border border-dashed border-line py-4 text-center text-xs text-ink/40">
              No subjects assigned yet
            </p>
          )}
          <div className="space-y-1.5">
            {classSubjects.map((s) => (
              <div key={s.id}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5">
                <div>
                  <span className="text-sm font-medium text-ink">{s.name}</span>
                  {s.code && <span className="ml-2 font-mono text-xs text-ink/40">{s.code}</span>}
                </div>
                <button onClick={() => handleRemove(s.id, s.name)}
                  className="rounded p-1 text-ink/30 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add subject */}
        <div className="border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/40">Add subject</p>
          {available.length === 0 ? (
            <p className="text-xs text-ink/40">
              All school subjects are assigned to this class.
              Create more subjects under Subjects.
            </p>
          ) : (
            <div className="flex gap-2">
              <Select
                placeholder="Select subject…"
                options={available.map((s) => ({ value: String(s.id), label: s.name }))}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                containerClassName="flex-1"
              />
              <Button size="sm" onClick={handleAdd} disabled={adding || !selectedSubjectId}>
                <Plus size={14} /> {adding ? "Adding…" : "Add"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-ink/40 leading-relaxed">
          Only subjects assigned here will appear when entering results or assigning teachers for this class.
        </p>
      </CardBody>
    </Card>
  );
}

/* ─── Class create/edit form ─── */
function ClassFormModal({ open, initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => isEdit
    ? { class_name: initial.class_name, arm: initial.arm || "", level: initial.level, capacity: initial.capacity }
    : { class_name: "", arm: "", level: "Junior", capacity: 35 });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.class_name.trim()) return toast.error("Enter a class name");
    setLoading(true);
    try {
      const payload = {
        class_name: form.class_name.trim(),
        arm: form.arm.trim(),
        level: form.level,
        capacity: Number(form.capacity) || 35,
      };
      if (isEdit) await updateClass(initial.id, payload);
      else await createClass(payload);
      toast.success(isEdit ? "Class updated" : "Class created");
      onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit class" : "Add class"}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Saving…" : "Save class"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Class name" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} placeholder="e.g. JSS1, Grade 4" />
        <Input label="Arm (optional)" value={form.arm} onChange={(e) => setForm({ ...form, arm: e.target.value })} placeholder="e.g. A, Gold, Blue" />
        <Select label="Level" options={["Junior", "Senior"]} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
        <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
      </div>
      <p className="mt-3 text-xs text-ink/45">
        Label will be "{(form.class_name + form.arm).trim() || "—"}". After creating the class, assign subjects to it from the Classes page.
      </p>
    </Modal>
  );
}