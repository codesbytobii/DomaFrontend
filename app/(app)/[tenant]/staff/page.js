"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Camera } from "lucide-react";
import { useStaff, createStaff } from "@/lib/api";
import { getErrorMessage, NG_STATES, QUALIFICATIONS, EMPLOYMENT_TYPES, STAFF_ROLES, MARITAL_STATUS } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
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

export default function StaffPage() {
  const { items: staff, isLoading, mutate } = useStaff();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("personal");
  const [form, setForm] = useState(EMPTY_FORM);
  const [qualifications, setQualifications] = useState([{ level: "", institution: "", year: "", certs: "" }]);
  const [guarantors, setGuarantors] = useState([{ name: "", relationship: "", phone: "", address: "" }]);
  const [photo, setPhoto] = useState(null);
  const photoRef = useRef();
  const staffId = `STF/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`;

  const u = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target.result); r.readAsDataURL(file); }
  };

  const updateQual = (i, key, val) => {
    setQualifications((prev) => prev.map((q, idx) => idx === i ? { ...q, [key]: val } : q));
  };
  const addQual = () => setQualifications((p) => [...p, { level: "", institution: "", year: "", certs: "" }]);
  const removeQual = (i) => setQualifications((p) => p.filter((_, idx) => idx !== i));

  const updateGuarantor = (i, key, val) => {
    setGuarantors((prev) => prev.map((g, idx) => idx === i ? { ...g, [key]: val } : g));
  };
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
      await createStaff({ name: `${form.surname} ${form.firstName}${form.middleName ? " " + form.middleName : ""}`, email: form.email, role: form.role.toLowerCase().replace(/\s+/g, "_"), subject: form.subjects });
      toast.success(`${form.firstName} ${form.surname} registered — login credentials will be sent to their email`);
      mutate(); handleClose();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const SI = ({ value, onChange, placeholder, type = "text", disabled, mono }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className={`h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 disabled:bg-paper ${mono ? "font-mono text-xs" : ""}`} />
  );
  const SS = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={onChange}
      className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
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

  return (
    <div>
      <PageHeader title="Staff" subtitle={`${staff.length} members registered`}>
        <Button size="md" onClick={() => setOpen(true)}><Plus size={16} /> Register staff</Button>
      </PageHeader>

      <Card className="overflow-hidden">
        <Table>
          <THead><TR><TH>Name</TH><TH>Role</TH><TH>Subject</TH><TH>Email</TH></TR></THead>
          <TBody>
            {isLoading && <TR><TD colSpan={4} className="py-8 text-center text-ink/45">Loading staff…</TD></TR>}
            {staff.map((m) => (
              <TR key={m.id}>
                <TD><div className="flex items-center gap-3"><Avatar name={m.name} size="sm" /><div><span className="font-medium text-ink block">{m.name}</span></div></div></TD>
                <TD className="capitalize">{m.role?.replace(/_/g, " ")}</TD>
                <TD>{m.subject || "—"}</TD>
                <TD className="text-ink/55">{m.email}</TD>
              </TR>
            ))}
            {!isLoading && staff.length === 0 && <TR><TD colSpan={4} className="py-8 text-center text-ink/45">No staff registered yet.</TD></TR>}
          </TBody>
        </Table>
      </Card>

      <Modal open={open} onClose={handleClose} title="" size="xl"
        footer={<div className="flex justify-end gap-2"><Button variant="subtle" onClick={handleClose}>Cancel</Button><Button onClick={submit} disabled={loading}>{loading ? "Saving…" : "Register staff member"}</Button></div>}
      >
        {/* Header */}
        <div className="-mx-6 -mt-6 mb-5 bg-forest-700 px-6 py-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Human resources</p>
            <h2 className="mt-1 font-display text-xl text-white">Staff registration form</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50">Staff ID</p>
            <p className="font-mono text-sm font-semibold text-white tracking-wider">{staffId}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="-mx-6 flex border-b border-line bg-paper px-6">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${tab === id ? "border-forest-500 text-forest-700" : "border-transparent text-ink/45 hover:text-ink/70"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {/* Personal info */}
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
                    <F label="Gender" required><SS value={form.gender} onChange={u("gender")} options={["Male","Female"]} placeholder="Select" /></F>
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

          {/* Employment */}
          {tab === "employment" && (
            <div>
              <Sec letter="B" title="Employment details" />
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Staff ID" hint="Auto-generated"><SI value={staffId} onChange={() => {}} disabled mono /></F>
                <F label="Date of employment" required><SI value={form.employmentDate} onChange={u("employmentDate")} type="date" /></F>
                <F label="Employment type" required><SS value={form.employmentType} onChange={u("employmentType")} options={EMPLOYMENT_TYPES} /></F>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Role / designation" required><SS value={form.role} onChange={u("role")} options={STAFF_ROLES} /></F>
                <F label="Department"><SI value={form.department} onChange={u("department")} placeholder="e.g. Sciences, Arts, Administration" /></F>
              </div>
              <Sec letter="C" title="Teaching assignment" />
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Subjects taught" hint="Separate multiple subjects with commas">
                  <textarea value={form.subjects} onChange={u("subjects")} rows={2} placeholder="e.g. Mathematics, Further Mathematics"
                    className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none" />
                </F>
                <F label="Classes assigned" hint="Separate multiple classes with commas">
                  <textarea value={form.classes} onChange={u("classes")} rows={2} placeholder="e.g. JSS1A, JSS2A, JSS3B"
                    className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none" />
                </F>
              </div>
            </div>
          )}

          {/* Qualifications — dynamic list */}
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
                      <F label="Certifications / professional registration" hint="e.g. PGDE, NTC, TRC number">
                        <SI value={q.certs} onChange={(e) => updateQual(i, "certs", e.target.value)} placeholder="List certifications" />
                      </F>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addQual}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-xs font-medium text-ink/50 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700 transition-colors">
                <Plus size={14} /> Add another qualification
              </button>
              <p className="mt-3 rounded-xl border border-line bg-paper px-4 py-3 text-xs text-ink/50">
                📎 Document uploads (certificates, degree certificates) are available from the staff profile page after saving.
              </p>
            </div>
          )}

          {/* Financial & NOK — with dynamic guarantors */}
          {tab === "financial" && (
            <div>
              <Sec letter="E" title="Salary payment details" />
              <div className="mb-4 flex gap-2.5 rounded-xl border border-line bg-paper p-3">
                <span className="mt-0.5 text-sm text-ink/40">🔒</span>
                <p className="text-xs text-ink/50 leading-relaxed">Confidential. Access restricted to authorised payroll personnel only.</p>
              </div>
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Bank name"><SI value={form.bankName} onChange={u("bankName")} placeholder="e.g. GTBank, Zenith, UBA" /></F>
                <F label="Account number"><SI value={form.accountNumber} onChange={u("accountNumber")} placeholder="10-digit NUBAN" mono /></F>
                <F label="BVN"><SI value={form.bvn} onChange={u("bvn")} placeholder="11-digit BVN" mono /></F>
              </div>

              <Sec letter="F" title="Guarantors" />
              <p className="-mt-2 mb-4 text-xs text-ink/50">A minimum of one guarantor is required. Add more if needed.</p>
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
                      <F label="Relationship to staff" required><SI value={g.relationship} onChange={(e) => updateGuarantor(i, "relationship", e.target.value)} placeholder="e.g. Former employer, Senior colleague" /></F>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3">
                      <F label="Phone number" required><SI value={g.phone} onChange={(e) => updateGuarantor(i, "phone", e.target.value)} placeholder="+234 800 000 0000" /></F>
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
