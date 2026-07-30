"use client";

import useSWR from "swr";
import api from "./axios";

/**
 * api.js — the single data layer between the UI and the Laravel API.
 *
 * Reads are SWR hooks (cache + revalidation + loading/error for free); writes
 * are plain async functions that return the created/updated record and let the
 * caller revalidate the relevant hook via its `mutate`.
 *
 * Every endpoint returns a `{ data: … }` envelope. Collection endpoints add
 * `meta` (pagination). The fetcher returns the whole envelope; hooks unwrap it.
 */
const fetcher = (url) => api.get(url).then((r) => r.data);

function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  return entries.length ? "?" + new URLSearchParams(entries).toString() : "";
}

/* ----------------------------- collection hooks ---------------------------- */

export function useStudents(params = {}) {
  // Pass null to skip fetching (e.g. before a class is selected).
  const skip = params === null;
  const { data, error, isLoading, mutate } = useSWR(skip ? null : `/students${qs(params)}`, fetcher);
  return { items: data?.data || [], meta: data?.meta, error, isLoading, mutate };
}

export function useClasses() {
  const { data, error, isLoading, mutate } = useSWR("/classes", fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export function useSubjects() {
  const { data, error, isLoading, mutate } = useSWR("/subjects", fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export function useStaff() {
  const { data, error, isLoading, mutate } = useSWR("/staff", fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export function useAnnouncements() {
  const { data, error, isLoading, mutate } = useSWR("/announcements", fetcher);
  return { items: data?.data || [], meta: data?.meta, error, isLoading, mutate };
}

export function useSessions(enabled = true) {
  const { data, error, isLoading } = useSWR(enabled ? "/sessions" : null, fetcher);
  return { sessions: data?.data || [], error, isLoading };
}

/** Current term across all sessions (tenant roles only). */
export function useCurrentTerm(enabled = true) {
  const { sessions } = useSessions(enabled);
  for (const s of sessions) {
    const t = (s.terms || []).find((x) => x.is_current);
    if (t) return t;
  }
  return null;
}

export function useInvoices(params = {}) {
  const { data, error, isLoading, mutate } = useSWR(`/invoices${qs(params)}`, fetcher);
  return { items: data?.data || [], meta: data?.meta, error, isLoading, mutate };
}

export function useFeeSummary() {
  const { data, error, isLoading, mutate } = useSWR("/invoices/summary", fetcher);
  return { summary: data?.data, error, isLoading, mutate };
}

/* ------------------------------ result sheet ------------------------------- */
// Only fetches once class + subject + term are all chosen.
export function useResultSheet({ class_arm_id, subject_id, term_id }) {
  const ready = class_arm_id && subject_id && term_id;
  const key = ready ? `/results${qs({ class_arm_id, subject_id, term_id })}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

/* ------------------------------ parent / child ----------------------------- */

export function useChildren() {
  const { data, error, isLoading, mutate } = useSWR("/children", fetcher);
  return { children: data?.data || [], error, isLoading, mutate };
}

export function useReportCard(studentId, termId) {
  const key = studentId && termId ? `/students/${studentId}/report-card${qs({ term_id: termId })}` : null;
  const { data, error, isLoading } = useSWR(key, fetcher);
  return { report: data?.data, error, isLoading };
}

export function useStudentAttendance(studentId) {
  const key = studentId ? `/students/${studentId}/attendance` : null;
  const { data, error, isLoading } = useSWR(key, fetcher);
  return { attendance: data?.data, error, isLoading };
}

export function useStudentInvoices(studentId) {
  const key = studentId ? `/students/${studentId}/invoices` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

/* ------------------------------- dashboards -------------------------------- */

export function useAdminDashboard() {
  const { data, error, isLoading } = useSWR("/dashboard/admin", fetcher);
  return { stats: data?.data, error, isLoading };
}

export function useTeacherDashboard() {
  const { data, error, isLoading } = useSWR("/dashboard/teacher", fetcher);
  return { stats: data?.data, error, isLoading };
}

/* ----------------------------- settings / templates ------------------------ */

export function useSchoolTemplates() {
  const { data, error, isLoading, mutate } = useSWR("/settings/templates", fetcher);
  return { plan: data?.data?.plan, templates: data?.data?.templates || [], error, isLoading, mutate };
}

export function useGradeScale() {
  const { data, error, isLoading } = useSWR("/settings/grade-scale", fetcher);
  return { bands: data?.data || [], error, isLoading };
}

/* -------------------------------- platform --------------------------------- */

export function usePlatformOverview() {
  const { data, error, isLoading } = useSWR("/platform/overview", fetcher);
  return { stats: data?.data, error, isLoading };
}

export function usePlatformSchools(q = "") {
  const { data, error, isLoading, mutate } = useSWR(`/platform/schools${qs({ q })}`, fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export function useSubscriptions() {
  const { data, error, isLoading, mutate } = useSWR("/platform/subscriptions", fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export function usePlatformTemplates() {
  const { data, error, isLoading, mutate } = useSWR("/platform/templates", fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

/* -------------------------------- mutations -------------------------------- */
const unwrap = (r) => r.data?.data ?? r.data;

// students
export const createStudent = (payload) => api.post("/students", payload).then(unwrap);
export const updateStudent = (id, payload) => api.patch(`/students/${id}`, payload).then(unwrap);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then(unwrap);

// classes & subjects
export const createClass = (payload) => api.post("/classes", payload).then(unwrap);
export const updateClass = (id, payload) => api.patch(`/classes/${id}`, payload).then(unwrap);
export const createSubject = (payload) => api.post("/subjects", payload).then(unwrap);

// results
export const saveResults = (payload) => api.post("/results", payload).then(unwrap);
export const submitResults = (payload) => api.post("/results/submit", payload).then(unwrap);
export const approveResults = (payload) => api.post("/results/approve", payload).then(unwrap);

// fees
export const recordPayment = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/payments`, payload).then(unwrap);
export const initiatePayment = (invoiceId) =>
  api.post(`/invoices/${invoiceId}/pay`).then(unwrap);

// attendance
export const markAttendance = (payload) => api.post("/attendance", payload).then(unwrap);

// communication
export const sendAnnouncement = (payload) => api.post("/announcements", payload).then(unwrap);

// staff
export const createStaff = (payload) => api.post("/staff", payload).then(unwrap);
export const updateStaff = (id, payload) => api.patch(`/staff/${id}`, payload).then(unwrap);
export const assignTeaching = (payload) => api.post("/staff/teaching", payload).then(unwrap);

// settings
export const updateSchool = (payload) => api.patch("/settings/school", payload).then(unwrap);
export const setDefaultTemplate = (template_id) =>
  api.post("/settings/template", { template_id }).then(unwrap);

// promotions
export const runPromotion = (classId, decisions) =>
  api.post(`/promotions/${classId}/run`, { decisions }).then(unwrap);

// platform
export const onboardSchool = (payload) => api.post("/platform/schools", payload).then(unwrap);
// payload: { plan, mrr, renews_at? } — plan/price are free-form now, super_admin
// sets whatever they've agreed with the school, not a fixed catalog price.
export const changePlan = (id, payload) => api.patch(`/platform/schools/${id}/plan`, payload).then(unwrap);
export const suspendSchool = (id) => api.post(`/platform/schools/${id}/suspend`).then(unwrap);
export const deleteSchool = (id) => api.delete(`/platform/schools/${id}`).then(unwrap);
export const createTemplate = (payload) => api.post("/platform/templates", payload).then(unwrap);
export const updateTemplate = (id, payload) => api.patch(`/platform/templates/${id}`, payload).then(unwrap);

// ─── Class subjects ───────────────────────────────────────────────────────────
export function useClassSubjects(classArmId) {
  const key = classArmId ? `/classes/${classArmId}/subjects` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export const addSubjectToClass = (classArmId, subjectId) =>
  api.post(`/classes/${classArmId}/subjects`, { subject_id: subjectId }).then(unwrap);

export const removeSubjectFromClass = (classArmId, subjectId) =>
  api.delete(`/classes/${classArmId}/subjects/${subjectId}`).then(unwrap);

// ─── All terms flat (for TermSelector) ───────────────────────────────────────
export function useAllTerms() {
  const { sessions } = useSessions();
  return sessions.flatMap((s) =>
    (s.terms || []).map((t) => ({ ...t, session_name: s.name }))
  );
}

// ─── Class report cards (for printing and 3rd term preview) ──────────────────
export function useClassReportCards(classArmId, termId) {
  const key = classArmId && termId
    ? `/results/class-cards?class_arm_id=${classArmId}&term_id=${termId}`
    : null;
  const { data, error, isLoading } = useSWR(key, fetcher);
  return { report: data?.data || null, error, isLoading };
}

// ─── Teaching assignments ─────────────────────────────────────────────────────
export function useTeachingAssignments() {
  const { data, error, isLoading, mutate } = useSWR('/staff/teaching', fetcher);
  return { items: data?.data || [], error, isLoading, mutate };
}

export const removeTeachingAssignment = (id) =>
  api.delete(`/staff/teaching/${id}`).then(unwrap);

// ─── Term management ──────────────────────────────────────────────────────────
export const createSession = (payload) =>
  api.post('/sessions', payload).then(unwrap);

export const createTerm = (sessionId, payload) =>
  api.post(`/sessions/${sessionId}/terms`, payload).then(unwrap);

export const openTerm = (termId) =>
  api.patch(`/terms/${termId}/open`).then(unwrap);

export const closeTerm = (termId) =>
  api.patch(`/terms/${termId}/close`).then(unwrap);

export const setCurrentTerm = (termId) =>
  api.post('/terms/current', { term_id: termId }).then(unwrap);

// Student skills and remarks
export function useStudentSkills(studentId, termId) {
  const key = studentId && termId ? `/students/${studentId}/skills?term_id=${termId}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);
  return { skills: data?.data?.skills || null, remarks: data?.data?.remarks || null, isLoading, mutate };
}

export const saveStudentSkills = (studentId, payload) =>
  api.post(`/students/${studentId}/skills`, payload).then(unwrap);

export const saveStudentRemarks = (studentId, payload) =>
  api.post(`/students/${studentId}/remarks`, payload).then(unwrap);

export function useFormClass(termId) {
  const key = termId ? `/form-class?term_id=${termId}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);
  return { formClass: data?.data || null, isLoading, mutate };
}