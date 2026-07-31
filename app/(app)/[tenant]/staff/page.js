"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Camera, BookOpen } from "lucide-react";
import { useStaff, useClasses, useClassSubjects, useTeachingAssignments, createStaff, assignTeaching, removeTeachingAssignment } from "@/lib/api";
import { getErrorMessage, NG_STATES, QUALIFICATIONS, EMPLOYMENT_TYPES, STAFF_ROLES, MARITAL_STATUS } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

const TABS = [
  { id: "personal", label: "Personal info" },
  { id: "employment", label: "Employment" },
  { id: "qualifications", label: "Qualifications" },
  { id: "financial", label: "Financial & NOK" },
];

const EMPTY_FORM = {
  surname: "", firstName: "", middleName: "", dob: "", gender: "", maritalStatus: "",
  phone: "", email: "", stateOfOrigin: "", lga: "", homeAddress: "",
  employmentDate: new Date().toISOString().slice(0, 10), employmentType: "Full-time",
  role: "Teacher", department: "", subjects: "", classes: "",
  bankName: "", accountNumber: "", bvn: "",
  nextOfKinName: "", nextOfKinPhone: "", nextOfKinRelationship: "",
};

// These four were previously defined INSIDE StaffPage, which meant React
// saw a brand-new component type on every keystroke (StaffPage re-renders
// on every setForm call) and remounted the underlying <input> each time —
// that's what was stealing focus after one character. Module scope keeps
// their identity stable across renders.
const SI = ({ value, onChange, placeholder, type = "text", disabled, mono }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    className={`h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 disabled:bg-paper ${mono ? "font-mono text-xs" : ""}`} />
);
const SS = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={onChange}
    className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200">
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
  </select>
);
const F = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/50">
      {label}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-ink/40 leading-tight">{hint}</p>}
  </div>
);
const Sec = ({ letter, title }) => (
  <div className="flex items-center gap-2.5 my-4 first:mt-1">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600 text-[10px] font-semibold text-white">{letter}</span>
    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/50 whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-line" />
  </div>
);

export default function StaffPage() {
  const { items: staff, isLoading, mutate } = useStaff();
  const { items: assignments, mutate: mutateAssignments } = useTeachingAssignments();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("personal");
  const [form, setForm] = useState(EMPTY_FORM);
  const [qualifications, setQualifications] = useState([{ level: "", institution: "", year: "", certs: "" }]);
  const [guarantors, setGuarantors] = useState([{ name: "", relationship: "", phone: "", address: "" }]);
  const [photo, setPhoto] = useState(null);
  const photoRef = useRef();
  // No client-side ID here anymore — it's server-generated on save (see
  // StaffController::store), sequential per school, and actually persisted.
  // Faking one client-side (as this used to do with Math.random()) meant a
  // different number on every render and nothing that matched the real
  // record.

  const u = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target.result); r.readAsDataURL(file); }
  };

  const updateQual = (i, key, val) => setQualifications((prev) => prev.map((q, idx) => idx === i ? { ...q, [key]: val } : q));
  const addQual = () => setQualifications((p) => [...p, { level: "", institution: "", year: "", certs: "" }]);
  const removeQual = (i) => setQualifications((p) => p.filter((_, idx) => idx !== i));

  const updateGuarantor = (i, key, val) => setGuarantors((prev) => prev.map((g, idx) => idx === i ? { ...g, [key]: val } : g));
  const addGuarantor = () => setGuarantors((p) => [...p, { name: "", relationship: "", phone: "", address: "" }]);
  const removeGuarantor = (i) => setGuarantors((p) => p.filter((_, idx) => idx !== i));

  const handleClose = () => {
    setOpen(false); setTab("personal"); setForm(EMPTY_FORM);
    setQualifications([{ level: "", institution: "", year: "", certs: "" }]);
    setGuarantors([{ name: "", relationship: "", phone: "", address: "" }]);
    setPhoto(null);
  };

  const submit = async () => {
    if (!form.surname || !form.firstName) return toast.error("Surname and first name are required");
    if (!form.email) return toast.error("Email is required");
    setLoading(true);
    try {
      const created = await createStaff({
        name: `${form.surname} ${form.firstName}${form.middleName ? " " + form.middleName : ""}`,
        email: form.email,
        role: form.role.toLowerCase().replace(/\s+/g, "_"),
        subject: form.subjects,
      });
      toast.success(`${form.firstName} ${form.surname} registered — Staff ID: ${created.staff_number}`);
      mutate(); handleClose();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Staff" subtitle={`${staff.length} members registered`}>
        <Button size="md" onClick={() => setOpen(true)}><Plus size={16} /> Register staff</Button>
      </PageHeader>

      {/* Staff table */}
      <Card className="overflow-hidden mb-6">
        <Table>
          <THead>
            <TR><TH>Staff ID</TH><TH>Name</TH><TH>Role</TH><TH>Subject</TH><TH>Email</TH></TR>
          </THead>
          <TBody>
            {isLoading && <TR><TD colSpan={5} className="py-8 text-center text-ink/45">Loading staff…</TD></TR>}
            {staff.map((m) => (
              <TR key={m.id}>
                <TD className="font-mono text-xs text-ink/55">{m.staff_number || "—"}</TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <span className="font-medium text-ink">{m.name}</span>
                  </div>
                </TD>
                <TD className="capitalize">{m.role?.replace(/_/g, " ")}</TD>
                <TD>{m.subject || "—"}</TD>
                <TD className="text-ink/55">{m.email}</TD>
              </TR>
            ))}
            {!isLoading && staff.length === 0 && (
              <TR><TD colSpan={5} className="py-8 text-center text-ink/45">No staff registered yet.</TD></TR>
            )}
          </TBody>
        </Table>
      </Card>

      {/* Teaching assignments section */}
      <TeachingAssignmentsSection
        staff={staff}
        assignments={assignments}
        onMutate={mutateAssignments}
      />

      {/* Staff registration modal */}
      <Modal open={open} onClose={handleClose} title="" size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={handleClose}>Cancel</Button>
            <Button onClick={submit} disabled={loading}>{loading ? "Saving…" : "Register staff member"}</Button>
          </div>
        }
      >
        <div className="-mx-6 -mt-6 mb-5 bg-forest-700 px-6 py-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Human resources</p>
            <h2 className="mt-1 font-display text-xl text-white">Staff registration form</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50">Staff ID</p>
            <p className="font-mono text-sm font-semibold text-white/70 tracking-wider">Assigned on save</p>
          </div>
        </div>

        <div className="-mx-6 flex border-b border-line bg-paper px-6">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${tab === id ? "border-forest-500 text-forest-700" : "border-transparent text-ink/45 hover:text-ink/70"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "personal" && (
            <div>
              <div className="flex gap-5 items-start">
                <div className="shrink-0">
                  <div onClick={() => photoRef.current.click()}
                    className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-line bg-paper"
                    style={{ borderColor: photo ? "#1B6B3A" : undefined }}>
                    {photo ? <img src={photo} className="h-full w-full object-cover" alt="staff" /> : <><Camera size={18} className="text-ink/30" /><p className="mt-1 text-[9px] text-ink/40 text-center">Staff photo</p></>}
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>
                <div className="flex-1">
                  <Sec letter="A" title="Biodata" />
                  <div className="grid grid-cols-3 gap-x-3">
                    <F label="Surname" required><SI value={form.surname} onChange={u("surname")} /></F>
                    <F label="First name" required><SI value={form.firstName} onChange={u("firstName")} /></F>
                    <F label="Middle name"><SI value={form.middleName} onChange={u("middleName")} /></F>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3">
                    <F label="Date of birth" required><SI value={form.dob} onChange={u("dob")} type="date" /></F>
                    <F label="Gender" required><SS value={form.gender} onChange={u("gender")} options={["Male", "Female"]} placeholder="Select" /></F>
                    <F label="Marital status"><SS value={form.maritalStatus} onChange={u("maritalStatus")} options={MARITAL_STATUS} placeholder="Select" /></F>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Phone number" required><SI value={form.phone} onChange={u("phone")} placeholder="+234 800 000 0000" /></F>
                <F label="Email address" required><SI value={form.email} onChange={u("email")} type="email" /></F>
              </div>
              <div className="grid grid-cols-3 gap-x-3">
                <F label="State of origin" required><SS value={form.stateOfOrigin} onChange={u("stateOfOrigin")} options={NG_STATES} placeholder="Select" /></F>
                <F label="LGA"><SI value={form.lga} onChange={u("lga")} /></F>
                <F label="Residential address"><SI value={form.homeAddress} onChange={u("homeAddress")} /></F>
              </div>
            </div>
          )}

          {tab === "employment" && (
            <div>
              <Sec letter="B" title="Employment details" />
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Staff ID" hint="Assigned automatically when you save — sequential per school, e.g. STF/2026/003"><SI value="Assigned on save" onChange={() => {}} disabled mono /></F>
                <F label="Date of employment" required><SI value={form.employmentDate} onChange={u("employmentDate")} type="date" /></F>
                <F label="Employment type" required><SS value={form.employmentType} onChange={u("employmentType")} options={EMPLOYMENT_TYPES} /></F>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Role / designation" required><SS value={form.role} onChange={u("role")} options={STAFF_ROLES} /></F>
                <F label="Department"><SI value={form.department} onChange={u("department")} placeholder="e.g. Sciences, Arts, Administration" /></F>
              </div>
              <div className="mt-3 rounded-xl border border-line bg-paper p-3">
                <p className="text-xs text-ink/50">
                  <strong className="text-ink">Note:</strong> After registering this staff member, use the <strong>Teaching Assignments</strong> section on the Staff page to assign them to specific subjects and classes. That is what grants them access to enter results.
                </p>
              </div>
            </div>
          )}

          {tab === "qualifications" && (
            <div>
              <Sec letter="D" title="Educational qualifications" />
              <p className="-mt-2 mb-4 text-xs text-ink/50">Add all relevant qualifications. Most recent first.</p>
              <div className="space-y-3">
                {qualifications.map((q, i) => (
                  <div key={i} className="relative rounded-xl border border-line bg-paper p-4">
                    {i > 0 && (
                      <button onClick={() => removeQual(i)}
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-ink/40 hover:bg-line hover:text-red-500">
                        <X size={13} />
                      </button>
                    )}
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">Qualification {i + 1}</p>
                    <div className="grid grid-cols-2 gap-x-3">
                      <F label="Level of qualification" required>
                        <SS value={q.level} onChange={(e) => updateQual(i, "level", e.target.value)} options={QUALIFICATIONS} placeholder="Select" />
                      </F>
                      <F label="Institution attended">
                        <SI value={q.institution} onChange={(e) => updateQual(i, "institution", e.target.value)} placeholder="University / Polytechnic / College" />
                      </F>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3">
                      <F label="Year obtained">
                        <SI value={q.year} onChange={(e) => updateQual(i, "year", e.target.value)} type="number" placeholder="e.g. 2018" />
                      </F>
                      <F label="Certifications">
                        <SI value={q.certs} onChange={(e) => updateQual(i, "certs", e.target.value)} placeholder="e.g. PGDE, NTC" />
                      </F>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addQual}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-xs font-medium text-ink/50 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 transition-colors">
                <Plus size={14} /> Add another qualification
              </button>
            </div>
          )}

          {tab === "financial" && (
            <div>
              <Sec letter="E" title="Salary payment details" />
              <div className="mb-4 flex gap-2.5 rounded-xl border border-line bg-paper p-3">
                <span className="mt-0.5 text-sm text-ink/40">🔒</span>
                <p className="text-xs text-ink/50 leading-relaxed">Confidential. Access restricted to authorised payroll personnel only.</p>
              </div>
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Bank name"><SI value={form.bankName} onChange={u("bankName")} placeholder="e.g. GTBank, Zenith" /></F>
                <F label="Account number"><SI value={form.accountNumber} onChange={u("accountNumber")} placeholder="10-digit NUBAN" mono /></F>
                <F label="BVN"><SI value={form.bvn} onChange={u("bvn")} placeholder="11-digit BVN" mono /></F>
              </div>
              <Sec letter="F" title="Guarantors" />
              <div className="space-y-3">
                {guarantors.map((g, i) => (
                  <div key={i} className="relative rounded-xl border border-line bg-paper p-4">
                    {i > 0 && (
                      <button onClick={() => removeGuarantor(i)}
                        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-ink/40 hover:bg-line hover:text-red-500">
                        <X size={13} />
                      </button>
                    )}
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">Guarantor {i + 1}</p>
                    <div className="grid grid-cols-2 gap-x-3">
                      <F label="Full name" required><SI value={g.name} onChange={(e) => updateGuarantor(i, "name", e.target.value)} /></F>
                      <F label="Relationship" required><SI value={g.relationship} onChange={(e) => updateGuarantor(i, "relationship", e.target.value)} placeholder="e.g. Former employer" /></F>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3">
                      <F label="Phone" required><SI value={g.phone} onChange={(e) => updateGuarantor(i, "phone", e.target.value)} /></F>
                      <F label="Address"><SI value={g.address} onChange={(e) => updateGuarantor(i, "address", e.target.value)} /></F>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addGuarantor}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-xs font-medium text-ink/50 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 transition-colors">
                <Plus size={14} /> Add another guarantor
              </button>
              <Sec letter="G" title="Next of kin" />
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Name" required><SI value={form.nextOfKinName} onChange={u("nextOfKinName")} /></F>
                <F label="Relationship" required><SI value={form.nextOfKinRelationship} onChange={u("nextOfKinRelationship")} /></F>
                <F label="Phone" required><SI value={form.nextOfKinPhone} onChange={u("nextOfKinPhone")} /></F>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ─── Teaching assignments section ─── */
function TeachingAssignmentsSection({ staff, assignments, onMutate }) {
  const { items: classes } = useClasses();
  const [classArmId, setClassArmId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);

  const { items: classSubjects } = useClassSubjects(classArmId || null);

  const teachers = staff.filter((s) => s.role === "teacher" || s.role === "school_admin");

  // Filter assignments shown for selected class (or show all)
  const filtered = classArmId
    ? assignments.filter((a) => String(a.class_arm_id) === classArmId)
    : assignments;

  const handleAssign = async () => {
    if (!teacherId) return toast.error("Select a teacher");
    if (!classArmId) return toast.error("Select a class");
    if (!subjectId) return toast.error("Select a subject");
    setSaving(true);
    try {
      await assignTeaching({
        teacher_id: Number(teacherId),
        class_arm_id: Number(classArmId),
        subject_id: Number(subjectId),
      });
      toast.success("Teaching assignment created");
      setSubjectId("");
      onMutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id) => {
    try {
      await removeTeachingAssignment(id);
      toast.success("Assignment removed");
      onMutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Teaching assignments</CardTitle>
          <p className="mt-0.5 text-xs text-ink/45">
            Assign teachers to specific subjects in specific classes. This is what grants a teacher access to enter results.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">

        {/* Assignment form */}
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/40">New assignment</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Select
              label="Teacher"
              placeholder="Select teacher…"
              options={teachers.map((t) => ({ value: String(t.id), label: t.name }))}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
            <Select
              label="Class"
              placeholder="Select class…"
              options={classes.map((c) => ({ value: String(c.id), label: c.label }))}
              value={classArmId}
              onChange={(e) => { setClassArmId(e.target.value); setSubjectId(""); }}
            />
            <Select
              label="Subject"
              placeholder={
                !classArmId ? "Select class first" :
                classSubjects.length === 0 ? "No subjects in this class" :
                "Select subject…"
              }
              options={classSubjects.map((s) => ({ value: String(s.id), label: s.name }))}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!classArmId || classSubjects.length === 0}
            />
            <div className="flex items-end">
              <Button
                className="w-full justify-center"
                onClick={handleAssign}
                disabled={saving || !teacherId || !classArmId || !subjectId}
              >
                {saving ? "Saving…" : <><Plus size={14} /> Assign</>}
              </Button>
            </div>
          </div>
          {classArmId && classSubjects.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              This class has no subjects yet. Go to <strong>Classes</strong> → click <strong>Subjects</strong> on the class row to assign subjects first.
            </p>
          )}
        </div>

        {/* Assignments list */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">
              {classArmId ? `Assignments for ${classes.find(c => String(c.id) === classArmId)?.label}` : "All assignments"} ({filtered.length})
            </p>
            {classArmId && (
              <button onClick={() => setClassArmId("")} className="text-xs text-ink/40 hover:text-ink underline">
                Show all
              </button>
            )}
          </div>

          {assignments.length === 0 && (
            <div className="rounded-xl border border-dashed border-line py-8 text-center">
              <BookOpen size={24} className="mx-auto mb-2 text-ink/20" />
              <p className="text-sm text-ink/40">No teaching assignments yet</p>
              <p className="mt-1 text-xs text-ink/30">Use the form above to assign teachers to classes and subjects</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-ink/50">Teacher</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-ink/50">Class</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-ink/50">Subject</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-ink/50"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-paper transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{a.teacher_name}</td>
                      <td className="px-4 py-3 text-ink/70">{a.class_label}</td>
                      <td className="px-4 py-3 text-ink/70">{a.subject_name}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemove(a.id)}
                          className="rounded p-1 text-ink/30 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Remove assignment"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}