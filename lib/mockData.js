/**
 * mockData.js — single source of dummy data for the whole app (all roles).
 * Shapes mirror the planned MySQL schema so swapping to the API is a no-op
 * for components. All money is whole Naira (integers).
 */

// ---------------------------------------------------------------- tenant (current school)
export const MOCK_SCHOOL = {
  id: 1, name: "Greenfield Academy", subdomain: "greenfield",
  plan: "School Suite", status: "active", logo_url: null,
  phone: "+234 803 000 1122", email: "hello@greenfield.edu.ng",
  address: "14 Awolowo Road, Ikoyi, Lagos", motto: "Knowledge · Character · Service",
};

export const MOCK_SESSIONS = [
  { id: 1, name: "2024/2025", start_date: "2024-09-09", end_date: "2025-07-25", is_current: true },
  { id: 2, name: "2023/2024", start_date: "2023-09-11", end_date: "2024-07-26", is_current: false },
];
export const MOCK_TERMS = [
  { id: 1, session_id: 1, name: "1st Term", is_current: false },
  { id: 2, session_id: 1, name: "2nd Term", is_current: true },
  { id: 3, session_id: 1, name: "3rd Term", is_current: false },
];

// ---------------------------------------------------------------- users (demo identities)
export const DEMO_USERS = {
  super_admin: { id: 100, name: "Tobi (Platform)", email: "admin@sembly.com", role: "super_admin", avatar_url: null },
  school_admin: { id: 1, school_id: 1, name: "Adunola Bakare", email: "adunola@greenfield.edu.ng", role: "school_admin", avatar_url: null },
  teacher: { id: 2, school_id: 1, name: "Mr. Bayo Ojo", email: "b.ojo@greenfield.edu.ng", role: "teacher", avatar_url: null, subject: "Mathematics", form_class: "JSS1B" },
  parent: { id: 3, school_id: 1, name: "James Okafor", email: "james.okafor@gmail.com", role: "parent", avatar_url: null, children: [1, 2] },
};

// ---------------------------------------------------------------- academic structure
// `next` drives the promotion flow; "Graduated" marks the exit class.
export const MOCK_CLASS_ARMS = [
  { id: 1, class_name: "JSS1", arm: "A", label: "JSS1A", level: "Junior", form_teacher: "Mrs. Grace Eze", students: 32, capacity: 35, next: "JSS2A" },
  { id: 2, class_name: "JSS1", arm: "B", label: "JSS1B", level: "Junior", form_teacher: "Mr. Bayo Ojo", students: 30, capacity: 35, next: "JSS2B" },
  { id: 3, class_name: "JSS2", arm: "A", label: "JSS2A", level: "Junior", form_teacher: "Mr. Sola Adeniyi", students: 28, capacity: 35, next: "JSS3A" },
  { id: 4, class_name: "JSS3", arm: "A", label: "JSS3A", level: "Junior", form_teacher: "Mrs. Ngozi Udeh", students: 31, capacity: 35, next: "SS1A" },
  { id: 5, class_name: "SS1", arm: "A", label: "SS1A", level: "Senior", form_teacher: "Mr. Tunde Bello", students: 27, capacity: 30, next: "SS2A" },
  { id: 6, class_name: "SS2", arm: "A", label: "SS2A", level: "Senior", form_teacher: "Mrs. Aisha Yusuf", students: 25, capacity: 30, next: "SS3A" },
  { id: 7, class_name: "SS3", arm: "A", label: "SS3A", level: "Senior", form_teacher: "Mr. Emeka Obi", students: 24, capacity: 30, next: "Graduated" },
];

export const MOCK_SUBJECTS = [
  { id: 1, name: "Mathematics", code: "MTH" }, { id: 2, name: "English Language", code: "ENG" },
  { id: 3, name: "Basic Science", code: "BSC" }, { id: 4, name: "Social Studies", code: "SOS" },
  { id: 5, name: "Civic Education", code: "CIV" }, { id: 6, name: "Computer Studies", code: "CMP" },
  { id: 7, name: "Yoruba", code: "YOR" }, { id: 8, name: "Agric Science", code: "AGR" },
];

// ---------------------------------------------------------------- students
const FIRST = ["Chidinma", "Emeka", "Aisha", "Tunde", "Ngozi", "Bola", "Ifeoma", "Yusuf", "Funke", "Obinna", "Halima", "Segun", "Amaka", "Kunle", "Zainab", "David", "Blessing", "Ahmed", "Temitope", "Uche"];
const LAST = ["Okafor", "Bello", "Adeyemi", "Eze", "Mohammed", "Olawale", "Nwankwo", "Ibrahim", "Adeniyi", "Okonkwo", "Lawal", "Ogunleye", "Udeh", "Balogun", "Yusuf"];

function makeStudents(n) {
  const arms = MOCK_CLASS_ARMS, out = [];
  for (let i = 0; i < n; i++) {
    const arm = arms[i % arms.length];
    out.push({
      id: i + 1, reg_number: `GFA/25/${String(i + 1).padStart(4, "0")}`,
      name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
      gender: i % 2 === 0 ? "Female" : "Male",
      class_arm_id: arm.id, class_label: arm.label,
      status: i % 11 === 0 ? "inactive" : "active",
      parent_name: `${LAST[(i * 5) % LAST.length]} Family`,
      parent_phone: `+234 80${(i % 9) + 1} ${String(1000000 + i * 137).slice(0, 3)} ${String(2000 + i).slice(0, 4)}`,
      avatar_url: null,
    });
  }
  return out;
}
export const MOCK_STUDENTS = makeStudents(57);

export function studentsInClass(label) {
  // deterministic roster generator scoped to a class
  const base = MOCK_STUDENTS.filter((s) => s.class_label === label);
  if (base.length) return base;
  const out = [];
  for (let i = 0; i < 10; i++) out.push({ id: `${label}-${i}`, name: `${FIRST[(i + label.length) % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`, reg_number: `GFA/25/${1000 + i}`, class_label: label });
  return out;
}

// ---------------------------------------------------------------- results (subject sheet)
export const MOCK_RESULTS = MOCK_STUDENTS.slice(0, 12).map((s, i) => ({
  id: i + 1, student_id: s.id, student_name: s.name, reg_number: s.reg_number,
  ca1: 12 + ((i * 3) % 8), ca2: 11 + ((i * 5) % 9), exam: 34 + ((i * 7) % 26), status: "draft",
}));

// ---------------------------------------------------------------- fees
export const MOCK_FEE_SUMMARY = {
  total_expected: 18750000, total_paid: 12480000, outstanding: 6270000,
  invoices_count: 57, paid_count: 38, partial_count: 11, unpaid_count: 8,
};
export const MOCK_INVOICES = MOCK_STUDENTS.slice(0, 24).map((s, i) => {
  const total = 285000 + (i % 4) * 40000;
  const paid = i % 7 === 0 ? 0 : i % 3 === 0 ? Math.round(total * 0.45) : total;
  const balance = total - paid;
  return {
    id: i + 1, invoice_no: `INV-2502-${String(i + 1).padStart(3, "0")}`,
    student_id: s.id, student_name: s.name, class_label: s.class_label,
    term: "2nd Term 2024/2025", total_amount: total, paid_amount: paid, balance,
    due_date: "2025-02-14", status: balance === 0 ? "paid" : paid === 0 ? "unpaid" : "partial",
  };
});

// ---------------------------------------------------------------- attendance
export const MOCK_ATTENDANCE_SUMMARY = MOCK_CLASS_ARMS.map((a, i) => ({
  class_arm_id: a.id, class_label: a.label, total: a.students,
  present: a.students - ((i % 4) + 1),
  rate: Math.round(((a.students - ((i % 4) + 1)) / a.students) * 1000) / 10,
}));

// ---------------------------------------------------------------- announcements
export const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: "Mid-Term Break", body: "School closes Friday 21st Feb and resumes Monday 3rd March.", channel: "SMS + In-app", sent_at: "2025-02-10T09:14:00", sent_by: "Adunola Bakare", recipients: 312 },
  { id: 2, title: "PTA Meeting Reminder", body: "Termly PTA meeting holds Saturday 15th Feb at 10am in the main hall.", channel: "SMS", sent_at: "2025-02-08T16:02:00", sent_by: "Adunola Bakare", recipients: 312 },
  { id: 3, title: "Inter-house Sports", body: "Annual inter-house sports competition scheduled for 28th Feb.", channel: "In-app", sent_at: "2025-02-05T11:30:00", sent_by: "Mr. Emeka Obi", recipients: 480 },
];

// ---------------------------------------------------------------- timetable
export const TIMETABLE_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TIMETABLE_PERIODS = ["8:00", "8:45", "9:30", "10:15", "11:30", "12:15", "1:00"];
export const MOCK_TIMETABLE = (() => {
  const subjects = MOCK_SUBJECTS, teachers = ["Mr. Ojo", "Mrs. Eze", "Mr. Bello", "Mrs. Yusuf", "Mr. Obi"], grid = {};
  TIMETABLE_DAYS.forEach((day, di) => {
    grid[day] = TIMETABLE_PERIODS.map((_, pi) => {
      if (pi === 3) return { subject: "Short Break", break: true };
      const s = subjects[(di * 2 + pi) % subjects.length];
      return { subject: s.name, code: s.code, teacher: teachers[(di + pi) % teachers.length] };
    });
  });
  return grid;
})();

// ---------------------------------------------------------------- admin dashboard
export const MOCK_DASHBOARD = {
  stats: { students: 480, students_delta: "+12 this term", fees_collected: 12480000, fees_delta: "67% of expected", attendance_rate: 94.2, attendance_delta: "+1.4% vs last week", results_pending: 6, results_delta: "classes awaiting approval" },
  collection: [
    { month: "Sep", collected: 1980, expected: 3120 }, { month: "Oct", collected: 2640, expected: 3120 },
    { month: "Nov", collected: 2980, expected: 3120 }, { month: "Dec", collected: 1240, expected: 3120 },
    { month: "Jan", collected: 2210, expected: 3120 }, { month: "Feb", collected: 1430, expected: 3120 },
  ],
  attendance_trend: [{ day: "Mon", rate: 95 }, { day: "Tue", rate: 93 }, { day: "Wed", rate: 96 }, { day: "Thu", rate: 92 }, { day: "Fri", rate: 94 }],
  recent_activity: [
    { id: 1, who: "Mr. Bayo Ojo", what: "submitted JSS1B Mathematics results", when: "12 min ago", type: "results" },
    { id: 2, who: "Accountant", what: "recorded ₦285,000 payment from Okafor family", when: "1 hr ago", type: "fees" },
    { id: 3, who: "Mrs. Grace Eze", what: "marked JSS1A attendance", when: "2 hrs ago", type: "attendance" },
    { id: 4, who: "Adunola Bakare", what: "sent Mid-Term Break SMS to 312 parents", when: "Yesterday", type: "comms" },
    { id: 5, who: "Mr. Emeka Obi", what: "added 3 new students to SS3A", when: "Yesterday", type: "students" },
  ],
};

// ---------------------------------------------------------------- staff
export const MOCK_STAFF = [
  { id: 1, name: "Mrs. Grace Eze", role: "Class Teacher", subjects: "English, Literature", form_class: "JSS1A", email: "g.eze@greenfield.edu.ng", status: "active" },
  { id: 2, name: "Mr. Bayo Ojo", role: "Class Teacher", subjects: "Mathematics", form_class: "JSS1B", email: "b.ojo@greenfield.edu.ng", status: "active" },
  { id: 3, name: "Mr. Sola Adeniyi", role: "Subject Teacher", subjects: "Basic Science", form_class: "—", email: "s.adeniyi@greenfield.edu.ng", status: "active" },
  { id: 4, name: "Mrs. Ngozi Udeh", role: "Class Teacher", subjects: "Social Studies", form_class: "JSS3A", email: "n.udeh@greenfield.edu.ng", status: "active" },
  { id: 5, name: "Adunola Bakare", role: "School Admin", subjects: "—", form_class: "—", email: "adunola@greenfield.edu.ng", status: "active" },
  { id: 6, name: "Mr. Emeka Obi", role: "Subject Teacher", subjects: "Economics", form_class: "—", email: "e.obi@greenfield.edu.ng", status: "active" },
];

// ---------------------------------------------------------------- teacher (Bayo Ojo) scope
export const TEACHER_CLASSES = [
  { label: "JSS1B", role: "Form teacher", students: 30, subject: null },
  { label: "JSS1A", role: "Mathematics", students: 32, subject: "Mathematics" },
  { label: "JSS2A", role: "Mathematics", students: 28, subject: "Mathematics" },
];
export const TEACHER_TODAY = [
  { time: "8:00", subject: "Mathematics — JSS1A", room: "Room 4" },
  { time: "9:30", subject: "Mathematics — JSS2A", room: "Room 7" },
  { time: "10:15", subject: "Free period", room: null },
  { time: "12:15", subject: "Mathematics — JSS1B", room: "Room 4" },
];

// ---------------------------------------------------------------- parent (James Okafor) children
export const PARENT_CHILDREN = [
  {
    id: 1, name: "Chidinma Okafor", initials: "CO", cls: "JSS2A", class_size: 28,
    results: [["Mathematics", 16, 15, 47], ["English Language", 15, 14, 43], ["Basic Science", 13, 12, 40], ["Social Studies", 12, 11, 35], ["Civic Education", 17, 16, 48], ["Computer Studies", 18, 17, 53], ["Yoruba", 11, 12, 31], ["Agric Science", 14, 13, 42]],
    attendance: { rate: 94, present: 58, late: 2, absent: 2, log: [["Mon 10 Feb", "Present"], ["Tue 11 Feb", "Present"], ["Wed 12 Feb", "Late"], ["Thu 13 Feb", "Present"], ["Fri 14 Feb", "Absent"]] },
    fee: { total: 325000, paid: 180000, due: "Due 14 Feb 2025", history: [["12 Jan 2025", "Part payment", 180000]] },
    remark_teacher: "A diligent and consistent student. She should aim for more in Yoruba next term.",
    remark_principal: "A very good result. Keep up the hard work, Chidinma.",
  },
  {
    id: 2, name: "Daniel Okafor", initials: "DO", cls: "SS1A", class_size: 27,
    results: [["Mathematics", 11, 12, 32], ["English Language", 13, 12, 38], ["Biology", 14, 13, 41], ["Chemistry", 12, 11, 34], ["Physics", 10, 11, 30], ["Economics", 15, 14, 44], ["Geography", 13, 12, 39], ["Civic Education", 16, 15, 47]],
    attendance: { rate: 88, present: 54, late: 4, absent: 4, log: [["Mon 10 Feb", "Present"], ["Tue 11 Feb", "Absent"], ["Wed 12 Feb", "Present"], ["Thu 13 Feb", "Late"], ["Fri 14 Feb", "Present"]] },
    fee: { total: 360000, paid: 360000, due: "Paid in full", history: [["8 Jan 2025", "Full payment", 360000]] },
    remark_teacher: "Capable but should improve focus in the sciences, especially Physics.",
    remark_principal: "A fair result. More consistency needed next term.",
  },
];

// ================================================================ PLATFORM (super admin)
export const PLATFORM_STATS = {
  total_schools: 42, schools_delta: "+3 this month",
  active_subscriptions: 38, subs_delta: "3 trials · 1 past due",
  mrr: 3840000, mrr_delta: "+₦240k vs last month",
  students: 11240, students_delta: "across 42 schools",
};

export const PLATFORM_SCHOOLS = [
  { id: 1, name: "Greenfield Academy", subdomain: "greenfield", plan: "School Suite", students: 480, mrr: 90000, status: "active", owner: "Adunola Bakare", joined: "Sep 2024", renews: "12 Jun 2026" },
  { id: 2, name: "Brightstars College", subdomain: "brightstars", plan: "Full School", students: 612, mrr: 150000, status: "active", owner: "Chinedu Okafor", joined: "Aug 2024", renews: "1 Jul 2026" },
  { id: 3, name: "Little Saints School", subdomain: "littlesaints", plan: "Starter", students: 210, mrr: 35000, status: "active", owner: "Funmi Adebayo", joined: "Jan 2025", renews: "20 Jun 2026" },
  { id: 4, name: "Hilltop Academy", subdomain: "hilltop", plan: "School Suite", students: 388, mrr: 90000, status: "trial", owner: "Musa Ibrahim", joined: "May 2026", renews: "Trial ends 9 Jun" },
  { id: 5, name: "Crown Heights School", subdomain: "crownheights", plan: "Full School", students: 540, mrr: 150000, status: "past_due", owner: "Grace Eze", joined: "Oct 2024", renews: "Overdue 4 days" },
];

export const PLANS = [
  { name: "Starter", price: 35000, schools: 11 },
  { name: "School Suite", price: 90000, schools: 19 },
  { name: "Full School", price: 150000, schools: 8 },
];

// ================================================================ report card templates
// `packages` controls which subscription plans can use each template.
export const REPORT_TEMPLATES = [
  { id: "classic", base: "classic", name: "Classic", desc: "Traditional bordered Nigerian report sheet with affective & psychomotor domains.", packages: ["Starter", "School Suite", "Full School"] },
  { id: "minimal", base: "minimal", name: "Minimal", desc: "Compact monochrome layout — ink-light, ideal for bulk printing.", packages: ["Starter", "School Suite", "Full School"] },
  { id: "modern", base: "modern", name: "Modern", desc: "Clean summary tiles with colour-coded grades and remark cards.", packages: ["School Suite", "Full School"] },
  { id: "branded", base: "branded", name: "Branded (Premium)", desc: "School crest, custom colours and a watermark for a bespoke feel.", packages: ["Full School"] },
];
