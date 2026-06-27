"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, ChevronLeft, ChevronRight, Check, Camera, X } from "lucide-react";
import { useStudents, useClasses, createStudent } from "@/lib/api";
import { getErrorMessage, NG_STATES, BLOOD_GROUPS, GENOTYPES, RELIGIONS } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Avatar from "@/components/shared/Avatar";
import Badge, { statusTone } from "@/components/shared/Badge";
import Modal from "@/components/shared/Modal";
import { Table, THead, TBody, TR, TH, TD, Pagination } from "@/components/shared";

const PER_PAGE = 20;

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Academic" },
  { id: 3, label: "Father" },
  { id: 4, label: "Mother" },
  { id: 5, label: "Emergency & Health" },
  { id: 6, label: "Confirm" },
];

const EMPTY_FORM = {
  // Personal
  surname: "", firstName: "", middleName: "", dob: "", gender: "", bloodGroup: "",
  genotype: "", religion: "", nationality: "Nigerian", stateOfOrigin: "", lga: "",
  placeOfBirth: "", homeAddress: "",
  // Academic
  classAdmittedInto: "", classArmId: "",
  session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  admissionDate: new Date().toISOString().slice(0, 10),
  previousSchool: "", previousAddress: "", lastClass: "", reasonForLeaving: "",
  // Father
  fatherSurname: "", fatherFirstName: "", fatherOccupation: "", fatherPhone: "",
  fatherEmail: "", fatherAddress: "", fatherNin: "", fatherAlive: true,
  // Mother
  motherSurname: "", motherFirstName: "", motherOccupation: "", motherPhone: "",
  motherEmail: "", motherAddress: "", motherNin: "", motherAlive: true,
  // Emergency
  emergencyName: "", emergencyRelationship: "", emergencyPhone: "", emergencyAddress: "",
  // Medical
  medicalConditions: "", allergies: "", medications: "", doctorName: "", doctorPhone: "", healthInsurance: "",
  declared: false,
};

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const { items, meta, isLoading, mutate } = useStudents({ q: query, class: classFilter, page, per_page: PER_PAGE });
  const { items: classes } = useClasses();
  const classOptions = classes.map((c) => c.label);
  const total = meta?.total ?? items.length;
  const lastPage = meta?.last_page ?? 1;

  return (
    <div>
      <PageHeader title="Students" subtitle={`${total} student${total !== 1 ? "s" : ""} enrolled`}>
        <Button size="md" onClick={() => setAddOpen(true)}><Plus size={16} /> Admit student</Button>
      </PageHeader>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Input icon={Search} placeholder="Search by name or reg number…" value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <Select placeholder="All classes" options={classOptions} value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} containerClassName="sm:w-44" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Student</TH><TH>Reg No.</TH><TH>Class</TH>
              <TH>Gender</TH><TH>Parent / Guardian</TH><TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && <TR><TD colSpan={6} className="py-10 text-center text-ink/45">Loading students…</TD></TR>}
            {!isLoading && items.map((s) => (
              <TR key={s.id}>
                <TD><div className="flex items-center gap-3"><Avatar name={s.name} src={s.avatar_url} size="sm" /><span className="font-medium text-ink">{s.name}</span></div></TD>
                <TD className="font-mono text-xs">{s.reg_number || "—"}</TD>
                <TD>{s.class_label}</TD>
                <TD>{s.gender || "—"}</TD>
                <TD><span className="block text-ink/75">{s.parent_name}</span><span className="block text-xs text-ink/45">{s.parent_phone}</span></TD>
                <TD><Badge tone={statusTone(s.status)}>{s.status}</Badge></TD>
              </TR>
            ))}
            {!isLoading && items.length === 0 && (
              <TR><TD colSpan={6} className="py-10 text-center text-ink/45">No students match your filters.</TD></TR>
            )}
          </TBody>
        </Table>
        <div className="border-t border-line px-4 py-2">
          <Pagination page={page} lastPage={lastPage} total={total} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </Card>

      <AdmissionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classes={classes}
        onSaved={() => { mutate(); setAddOpen(false); }}
      />
    </div>
  );
}

/* ─── Multi-step admission form ─── */
function AdmissionModal({ open, onClose, classes, onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const photoRef = useRef();

  const u = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const ub = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.checked }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target.result); r.readAsDataURL(file); }
  };

  const handleClose = () => { setStep(1); setForm(EMPTY_FORM); setPhoto(null); onClose(); };

  const submit = async () => {
    if (!form.surname || !form.firstName) return toast.error("Surname and first name are required");
    if (!form.classAdmittedInto) return toast.error("Class is required");
    if (!form.declared) return toast.error("Please confirm the declaration");
    setLoading(true);
    try {
      const cls = classes.find((c) => c.label === form.classAdmittedInto);
      const regNo = `${(form.stateOfOrigin || "ADM").slice(0, 3).toUpperCase()}/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9000) + 1000)}`;
      await createStudent({
        name: [form.surname, form.firstName, form.middleName].filter(Boolean).join(" "),
        gender: form.gender,
        class_label: form.classAdmittedInto,
        class_arm_id: cls?.id || null,
        reg_number: regNo,
        parent_name: [form.fatherSurname || form.motherSurname, form.fatherFirstName || form.motherFirstName].filter(Boolean).join(" ") || "Family",
        parent_phone: form.fatherPhone || form.motherPhone || "",
      });
      toast.success(`${form.firstName} ${form.surname} admitted`);
      onSaved();
      handleClose();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const admissionNo = `ADM/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  const F = ({ label, required, hint, children, span }) => (
    <div className={span === 2 ? "sm:col-span-2" : undefined} style={{ marginBottom: 14 }}>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/50">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink/40 leading-tight">{hint}</p>}
    </div>
  );

  const SI = ({ value, onChange, placeholder, type = "text", disabled }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 disabled:bg-paper"
    />
  );

  const SS = ({ value, onChange, options, placeholder }) => (
    <select value={value} onChange={onChange}
      className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const Sec = ({ letter, title }) => (
    <div className="flex items-center gap-2.5 my-5 first:mt-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-600 text-[10px] font-semibold text-white">{letter}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/50 whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} title="" size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ChevronLeft size={15} /> Previous
          </Button>
          <span className="text-xs text-ink/45">Step {step} of {STEPS.length}</span>
          {step < STEPS.length
            ? <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>Next <ChevronRight size={15} /></Button>
            : <Button size="sm" disabled={!form.declared || loading} onClick={submit}><Check size={14} /> {loading ? "Submitting…" : "Submit admission"}</Button>
          }
        </div>
      }
    >
      {/* Form header */}
      <div className="-mx-6 -mt-6 mb-5 bg-forest-700 px-6 py-4 flex justify-between items-start">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Student admission</p>
          <h2 className="mt-1 font-display text-xl text-white">Admission form</h2>
          <p className="mt-0.5 text-xs text-white/65">Academic session {form.session}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/50">Form no.</p>
          <p className="font-mono text-sm font-semibold text-white tracking-wider">{admissionNo}</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="-mx-6 border-b border-line bg-paper px-6 pb-3">
        <div className="flex justify-between mb-2.5">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all"
                style={{ background: step > s.id ? "#1B6B3A" : step === s.id ? "#1B6B3A" : "#E7E9E4", color: step >= s.id ? "#fff" : "#9BA8A3", border: step === s.id ? "3px solid rgba(27,107,58,0.2)" : "none" }}>
                {step > s.id ? <Check size={11} /> : s.id}
              </div>
              <span className="text-[9px] font-medium text-center leading-tight" style={{ color: step === s.id ? "#1B6B3A" : "#9BA8A3" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className="h-1 rounded-full bg-line overflow-hidden">
          <div className="h-full rounded-full bg-forest-600 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* STEP 1 — Personal */}
      {step === 1 && (
        <div>
          <Sec letter="A" title="Passport photograph & biodata" />
          <div className="flex gap-5 items-start">
            <div className="shrink-0">
              <div onClick={() => photoRef.current.click()}
                className="flex h-28 w-22 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-line bg-paper"
                style={{ width: 88, borderColor: photo ? "#1B6B3A" : undefined }}>
                {photo
                  ? <img src={photo} className="h-full w-full object-cover" alt="passport" />
                  : <><Camera size={20} className="text-ink/30" /><p className="mt-1.5 text-[9px] text-ink/40 text-center leading-tight">Passport<br />35mm × 45mm</p></>
                }
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              <p className="mt-1.5 text-center text-[9px] leading-tight text-ink/40">White bg<br />Recent photo</p>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Surname" required><SI value={form.surname} onChange={u("surname")} placeholder="As on birth certificate" /></F>
                <F label="First name" required><SI value={form.firstName} onChange={u("firstName")} /></F>
                <F label="Middle name"><SI value={form.middleName} onChange={u("middleName")} placeholder="If applicable" /></F>
              </div>
              <div className="grid grid-cols-4 gap-x-3">
                <F label="Date of birth" required><SI value={form.dob} onChange={u("dob")} type="date" /></F>
                <F label="Gender" required><SS value={form.gender} onChange={u("gender")} options={["Male","Female"]} placeholder="Select" /></F>
                <F label="Nationality"><SI value={form.nationality} onChange={u("nationality")} /></F>
                <F label="Place of birth"><SI value={form.placeOfBirth} onChange={u("placeOfBirth")} placeholder="City, State" /></F>
              </div>
            </div>
          </div>
          <Sec letter="B" title="Health & origin" />
          <div className="grid grid-cols-4 gap-x-3">
            <F label="Blood group"><SS value={form.bloodGroup} onChange={u("bloodGroup")} options={BLOOD_GROUPS} placeholder="Select" /></F>
            <F label="Genotype"><SS value={form.genotype} onChange={u("genotype")} options={GENOTYPES} placeholder="Select" /></F>
            <F label="Religion"><SS value={form.religion} onChange={u("religion")} options={RELIGIONS} placeholder="Select" /></F>
            <F label="State of origin" required><SS value={form.stateOfOrigin} onChange={u("stateOfOrigin")} options={NG_STATES} placeholder="Select" /></F>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <F label="LGA" required><SI value={form.lga} onChange={u("lga")} placeholder="Local Government Area" /></F>
            <F label="Home address"><SI value={form.homeAddress} onChange={u("homeAddress")} placeholder="Full residential address" /></F>
          </div>
        </div>
      )}

      {/* STEP 2 — Academic */}
      {step === 2 && (
        <div>
          <Sec letter="C" title="Admission details" />
          <div className="grid grid-cols-3 gap-x-3">
            <F label="Admission number" hint="Auto-generated"><SI value={admissionNo} onChange={() => {}} disabled /></F>
            <F label="Class admitted into" required>
              <SS value={form.classAdmittedInto} onChange={u("classAdmittedInto")} options={classes.map((c) => c.label)} placeholder="Select class" />
            </F>
            <F label="Academic session" required><SI value={form.session} onChange={u("session")} placeholder="2025/2026" /></F>
          </div>
          <F label="Date of admission" required><SI value={form.admissionDate} onChange={u("admissionDate")} type="date" /></F>
          <Sec letter="D" title="Previous school" />
          <div className="grid grid-cols-2 gap-x-3">
            <F label="Previous school name"><SI value={form.previousSchool} onChange={u("previousSchool")} placeholder="Full name (if any)" /></F>
            <F label="Previous school address"><SI value={form.previousAddress} onChange={u("previousAddress")} placeholder="Address" /></F>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <F label="Last class attended"><SI value={form.lastClass} onChange={u("lastClass")} placeholder="e.g. Primary 6, JSS2" /></F>
            <F label="Reason for leaving"><SI value={form.reasonForLeaving} onChange={u("reasonForLeaving")} placeholder="e.g. Graduated, Relocation" /></F>
          </div>
        </div>
      )}

      {/* STEP 3 — Father */}
      {step === 3 && (
        <div>
          <Sec letter="E" title="Father's details" />
          <label className="mb-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5">
            <input type="checkbox" checked={form.fatherAlive} onChange={ub("fatherAlive")} className="accent-forest-600" />
            <span className="text-sm text-ink">Father is alive</span>
          </label>
          {form.fatherAlive ? (
            <>
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Surname" required><SI value={form.fatherSurname} onChange={u("fatherSurname")} /></F>
                <F label="First name" required><SI value={form.fatherFirstName} onChange={u("fatherFirstName")} /></F>
                <F label="Occupation" required><SI value={form.fatherOccupation} onChange={u("fatherOccupation")} placeholder="e.g. Lawyer, Civil servant" /></F>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Phone number" required><SI value={form.fatherPhone} onChange={u("fatherPhone")} placeholder="+234 800 000 0000" /></F>
                <F label="Email address"><SI value={form.fatherEmail} onChange={u("fatherEmail")} type="email" /></F>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Home / business address"><SI value={form.fatherAddress} onChange={u("fatherAddress")} placeholder="If different from student's" /></F>
                <F label="NIN (National Identity Number)"><SI value={form.fatherNin} onChange={u("fatherNin")} placeholder="11-digit NIN" /></F>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-700">
              Father&apos;s section is not required. The mother or guardian will serve as primary contact.
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — Mother */}
      {step === 4 && (
        <div>
          <Sec letter="F" title="Mother's details" />
          <label className="mb-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2.5">
            <input type="checkbox" checked={form.motherAlive} onChange={ub("motherAlive")} className="accent-forest-600" />
            <span className="text-sm text-ink">Mother is alive</span>
          </label>
          {form.motherAlive ? (
            <>
              <div className="grid grid-cols-3 gap-x-3">
                <F label="Surname" required><SI value={form.motherSurname} onChange={u("motherSurname")} /></F>
                <F label="First name" required><SI value={form.motherFirstName} onChange={u("motherFirstName")} /></F>
                <F label="Occupation" required><SI value={form.motherOccupation} onChange={u("motherOccupation")} placeholder="e.g. Nurse, Business owner" /></F>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Phone number" required><SI value={form.motherPhone} onChange={u("motherPhone")} placeholder="+234 800 000 0000" /></F>
                <F label="Email address"><SI value={form.motherEmail} onChange={u("motherEmail")} type="email" /></F>
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                <F label="Home / business address"><SI value={form.motherAddress} onChange={u("motherAddress")} placeholder="If different from student's" /></F>
                <F label="NIN (National Identity Number)"><SI value={form.motherNin} onChange={u("motherNin")} placeholder="11-digit NIN" /></F>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-700">
              Mother&apos;s section is not required. Father&apos;s information will be used as primary contact.
            </div>
          )}
        </div>
      )}

      {/* STEP 5 — Emergency & Medical */}
      {step === 5 && (
        <div>
          <Sec letter="G" title="Emergency contact" />
          <p className="-mt-3 mb-4 text-xs text-ink/50">Must be different from both parents and reachable at all times during school hours.</p>
          <div className="grid grid-cols-2 gap-x-3">
            <F label="Full name" required><SI value={form.emergencyName} onChange={u("emergencyName")} /></F>
            <F label="Relationship to student" required><SI value={form.emergencyRelationship} onChange={u("emergencyRelationship")} placeholder="e.g. Uncle, Grandparent, Guardian" /></F>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <F label="Phone number" required><SI value={form.emergencyPhone} onChange={u("emergencyPhone")} placeholder="+234 800 000 0000" /></F>
            <F label="Address" required><SI value={form.emergencyAddress} onChange={u("emergencyAddress")} /></F>
          </div>
          <Sec letter="H" title="Medical information" />
          <div className="mb-4 flex gap-2.5 rounded-xl border border-gold-200 bg-gold-50 p-3">
            <span className="text-sm text-gold-600 mt-0.5">⚠</span>
            <p className="text-xs text-gold-700 leading-relaxed">Confidential. Used only for the student&apos;s welfare and emergency response. Not shared with other students or parents.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <F label="Known medical conditions" hint='Write "None" if none. e.g. Asthma, Diabetes, Sickle cell'>
              <textarea value={form.medicalConditions} onChange={u("medicalConditions")} rows={3} placeholder="List conditions…"
                className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none" />
            </F>
            <F label="Known allergies" hint='Write "None" if none. e.g. Penicillin, Peanuts, Latex'>
              <textarea value={form.allergies} onChange={u("allergies")} rows={3} placeholder="List allergies…"
                className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/35 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none" />
            </F>
          </div>
          <div className="grid grid-cols-3 gap-x-3">
            <F label="Current medications"><SI value={form.medications} onChange={u("medications")} placeholder="If none, leave blank" /></F>
            <F label="Family doctor's name"><SI value={form.doctorName} onChange={u("doctorName")} placeholder="Dr. Name" /></F>
            <F label="Doctor's phone"><SI value={form.doctorPhone} onChange={u("doctorPhone")} /></F>
          </div>
          <F label="HMO / health insurance number"><SI value={form.healthInsurance} onChange={u("healthInsurance")} placeholder="If applicable" /></F>
        </div>
      )}

      {/* STEP 6 — Confirm */}
      {step === 6 && (
        <div>
          <Sec letter="I" title="Review & declaration" />
          <div className="mb-4 rounded-xl border border-line bg-paper p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ["Student name", [form.surname, form.firstName, form.middleName].filter(Boolean).join(" ")],
                ["Date of birth", form.dob],
                ["Gender", form.gender],
                ["Blood group", form.bloodGroup],
                ["State of origin", form.stateOfOrigin],
                ["Class", form.classAdmittedInto],
                ["Father", [form.fatherSurname, form.fatherFirstName].filter(Boolean).join(" ") || (form.fatherAlive ? "—" : "Deceased")],
                ["Mother", [form.motherSurname, form.motherFirstName].filter(Boolean).join(" ") || (form.motherAlive ? "—" : "Deceased")],
                ["Emergency contact", form.emergencyName],
                ["Medical conditions", form.medicalConditions ? form.medicalConditions.slice(0, 40) + (form.medicalConditions.length > 40 ? "…" : "") : "Not provided"],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-line pb-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.07em] text-ink/40">{label}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{value || <span className="text-ink/35 italic">Not provided</span>}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4 rounded-xl border border-line bg-paper p-4 text-xs leading-relaxed text-ink/60">
            <strong className="text-ink">Declaration: </strong>I hereby certify that all information provided in this form is true, complete, and accurate. I understand that any false declaration may result in cancellation of this admission. I agree that the student will abide by all rules and regulations of this institution.
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={form.declared} onChange={ub("declared")} className="mt-0.5 accent-forest-600" />
            <span className="text-sm leading-relaxed text-ink">I confirm that all information above is accurate and I accept the school's terms and conditions of admission.</span>
          </label>
        </div>
      )}
    </Modal>
  );
}
