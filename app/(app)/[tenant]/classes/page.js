"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { useTenantPath } from "@/lib/tenant";
import {
  useClasses, useStaff, useSubjects, useClassSubjects,
  createClass, updateClass,
  addSubjectToClass, removeSubjectFromClass,
} from "@/lib/api";
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
  const router = useRouter();
  const tpath = useTenantPath();
  const { items: classes, isLoading } = useClasses();
  const user = useStore((s) => s.user);

  return (
    <div>
      <PageHeader title="My classes" subtitle="Classes you are assigned to teach" />
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
            <Button
              variant="outline" size="sm" className="mt-4"
              onClick={() => router.push(tpath("/results"))}
            >
              Enter results
            </Button>
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
  const { items: staff } = useStaff();
  const [classModal, setClassModal] = useState(undefined);
  const [subjectPanel, setSubjectPanel] = useState(null);

  const teachers = staff.filter((s) => s.role === "teacher" || s.role === "school_admin");

  return (
    <div>
      <PageHeader title="Classes & arms" subtitle="Create classes, assign subjects to each class, and set promotion targets">
        <Button onClick={() => setClassModal(null)}>
          <Plus size={16} /> Add class
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">

        {/* Class table */}
        <div>
          <Card className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Class</TH>
                  <TH>Level</TH>
                  <TH>Form teacher</TH>
                  <TH>Promotes to</TH>
                  <TH className="text-right">Students</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {isLoading && (
                  <TR><TD colSpan={6} className="py-8 text-center text-ink/45">Loading…</TD></TR>
                )}
                {classes.map((c) => (
                  <TR key={c.id} className={cn(subjectPanel?.id === c.id ? "bg-forest-50" : "")}>
                    <TD className="font-medium text-ink">{c.label}</TD>
                    <TD>
                      <Badge tone={c.level === "Junior" ? "forest" : "gold"}>{c.level}</Badge>
                    </TD>
                    <TD>{c.form_teacher || "—"}</TD>
                    <TD>
                      {c.next_class_label
                        ? <span className={cn(
                            "text-sm",
                            c.next_class_label === "Graduated" ? "font-medium text-gold-600" : "text-ink/70"
                          )}>
                            {c.next_class_label}
                          </span>
                        : <span className="text-ink/30">—</span>
                      }
                    </TD>
                    <TD className="text-right">{c.students ?? 0}</TD>
                    <TD>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSubjectPanel(subjectPanel?.id === c.id ? null : c)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                            subjectPanel?.id === c.id
                              ? "border-forest-400 bg-forest-50 text-forest-700"
                              : "border-line text-ink/55 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700"
                          )}
                        >
                          <BookOpen size={12} /> Subjects
                        </button>
                        <Button variant="outline" size="sm" onClick={() => setClassModal(c)}>
                          Edit
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
                {!isLoading && classes.length === 0 && (
                  <TR>
                    <TD colSpan={6} className="py-8 text-center text-ink/45">
                      No classes yet. Click <strong>Add class</strong> to get started.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </Card>
          <p className="mt-3 text-xs text-ink/45">
            Promotion targets are used at end of session under the Promotions tab.
          </p>
        </div>

        {/* Subject panel — slides in when a class row is clicked */}
        {subjectPanel && (
          <SubjectPanel
            cls={subjectPanel}
            onClose={() => setSubjectPanel(null)}
          />
        )}
      </div>

      <ClassFormModal
        key={classModal === undefined ? "closed" : classModal?.id || "new"}
        open={classModal !== undefined}
        initial={classModal}
        classes={classes}
        teachers={teachers}
        onClose={() => setClassModal(undefined)}
        onSaved={() => { mutate(); setClassModal(undefined); }}
      />
    </div>
  );
}

/* ─── Subject panel ─── */
function SubjectPanel({ cls, onClose }) {
  const { items: classSubjects, isLoading, mutate } = useClassSubjects(cls.id);
  const { items: allSubjects } = useSubjects();
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [adding, setAdding] = useState(false);

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
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (subjectId, subjectName) => {
    try {
      await removeSubjectFromClass(cls.id, subjectId);
      toast.success(`${subjectName} removed from ${cls.label}`);
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card className="h-fit sticky top-20">
      <CardHeader>
        <div>
          <CardTitle>Subjects — {cls.label}</CardTitle>
          <p className="mt-0.5 text-xs text-ink/45">
            {cls.level} · {cls.students ?? 0} students
          </p>
        </div>
        <button onClick={onClose} className="text-ink/35 hover:text-ink">
          <X size={16} />
        </button>
      </CardHeader>

      <CardBody className="space-y-5">

        {/* Assigned subjects list */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
            Assigned ({classSubjects.length})
          </p>
          {isLoading && (
            <p className="text-sm text-ink/45">Loading…</p>
          )}
          {!isLoading && classSubjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-line py-5 text-center">
              <p className="text-xs text-ink/40">No subjects assigned yet</p>
              <p className="mt-1 text-xs text-ink/30">Add subjects below</p>
            </div>
          )}
          <div className="space-y-1.5">
            {classSubjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen size={13} className="text-forest-500 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-ink">{s.name}</span>
                    {s.code && (
                      <span className="ml-2 font-mono text-[10px] text-ink/40">{s.code}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(s.id, s.name)}
                  className="rounded p-1 text-ink/25 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title={`Remove ${s.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add subject */}
        <div className="border-t border-line pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
            Add subject
          </p>
          {available.length === 0 && allSubjects.length > 0 && (
            <p className="text-xs text-ink/45">
              All school subjects are assigned to this class.
            </p>
          )}
          {allSubjects.length === 0 && (
            <p className="text-xs text-ink/45">
              No subjects created yet. Go to <strong>Subjects</strong> in the sidebar to create them first.
            </p>
          )}
          {available.length > 0 && (
            <div className="flex gap-2">
              <Select
                placeholder="Select subject…"
                options={available.map((s) => ({ value: String(s.id), label: s.name }))}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                containerClassName="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={adding || !selectedSubjectId}
              >
                {adding ? "…" : <Plus size={14} />}
              </Button>
            </div>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-ink/40">
          Only subjects listed here will appear in the results sheet and teacher assignment for {cls.label}.
        </p>
      </CardBody>
    </Card>
  );
}

/* ─── Class create / edit modal ─── */
function ClassFormModal({ open, initial, classes = [], teachers = [], onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          class_name: initial.class_name,
          arm: initial.arm || "",
          level: initial.level,
          capacity: initial.capacity,
          form_teacher_id: initial.form_teacher_id || "",
          next_class_label: initial.next_class_label || "",
        }
      : {
          class_name: "",
          arm: "",
          level: "Junior",
          capacity: 35,
          form_teacher_id: "",
          next_class_label: "",
        }
  );
  const [loading, setLoading] = useState(false);

  const currentLabel = (form.class_name + form.arm).trim();

  // Other classes available as promotion target (exclude this class itself)
  const promotionOptions = [
    { value: "", label: "Not set" },
    ...classes
      .filter((c) => c.label !== currentLabel)
      .map((c) => ({ value: c.label, label: c.label })),
    { value: "Graduated", label: "Graduated — exit class (e.g. SS3)" },
  ];

  const teacherOptions = [
    { value: "", label: "Unassigned" },
    ...teachers.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const submit = async () => {
    if (!form.class_name.trim()) return toast.error("Enter a class name");
    setLoading(true);
    try {
      const payload = {
        class_name: form.class_name.trim(),
        arm: form.arm.trim(),
        level: form.level,
        capacity: Number(form.capacity) || 35,
        form_teacher_id: form.form_teacher_id ? Number(form.form_teacher_id) : null,
        next_class_label: form.next_class_label || null,
      };
      if (isEdit) await updateClass(initial.id, payload);
      else await createClass(payload);
      toast.success(isEdit ? "Class updated" : "Class created");
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${initial?.label}` : "Add class"}
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Saving…" : "Save class"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Class name"
          value={form.class_name}
          onChange={(e) => setForm({ ...form, class_name: e.target.value })}
          placeholder="e.g. JSS1, Grade 4, Nursery 2"
        />
        <Input
          label="Arm (optional)"
          value={form.arm}
          onChange={(e) => setForm({ ...form, arm: e.target.value })}
          placeholder="e.g. A, Gold, Blue"
        />
        <Select
          label="Level"
          options={["Junior", "Senior"]}
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
        />
        <Input
          label="Capacity"
          type="number"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <Select
          label="Form teacher"
          options={teacherOptions}
          value={String(form.form_teacher_id || "")}
          onChange={(e) => setForm({ ...form, form_teacher_id: e.target.value })}
          containerClassName="sm:col-span-2"
        />
        <Select
          label="Promote to (next class)"
          options={promotionOptions}
          value={form.next_class_label || ""}
          onChange={(e) => setForm({ ...form, next_class_label: e.target.value })}
          containerClassName="sm:col-span-2"
          hint="At end of session, students here will move to this class. Set to 'Graduated' for your final year class."
        />
      </div>

      {currentLabel && (
        <p className="mt-3 text-xs text-ink/45">
          Class label will be <strong>{currentLabel}</strong>.
          {form.next_class_label && (
            <> Students promote to <strong>{form.next_class_label}</strong> at end of session.</>
          )}
        </p>
      )}

      {!isEdit && (
        <p className="mt-2 text-xs text-ink/40">
          After creating, click <strong>Subjects</strong> on the class row to assign subjects.
        </p>
      )}
    </Modal>
  );
}
