import clsx from "clsx";

/**
 * cn — tiny className combiner.
 * We use clsx (not tailwind-merge) to keep deps light; conflicting utilities
 * are avoided by convention in the components rather than auto-merged.
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * formatNaira — money is the heart of a school SaaS, so it gets first-class
 * treatment. The PRD stores money as integers (naira). We format with the ₦
 * glyph and thousands separators. Pass { kobo: true } if a value ever arrives
 * in kobo so we divide by 100 in one obvious place instead of scattering /100.
 */
export function formatNaira(amount, { kobo = false } = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₦0";
  const naira = kobo ? amount / 100 : amount;
  return "₦" + Number(naira).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

/**
 * getGrade — converts a 0–100 score to a Nigerian-style grade + remark.
 * Schools configure their own scale (grading_scales table), so this is the
 * sensible default; once the backend serves a scale we feed it in here.
 */
export function getGrade(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return { grade: "-", remark: "—", color: "gray" };
  }
  if (score >= 75) return { grade: "A1", remark: "Excellent", color: "forest" };
  if (score >= 70) return { grade: "B2", remark: "Very Good", color: "forest" };
  if (score >= 65) return { grade: "B3", remark: "Good", color: "forest" };
  if (score >= 60) return { grade: "C4", remark: "Credit", color: "gold" };
  if (score >= 55) return { grade: "C5", remark: "Credit", color: "gold" };
  if (score >= 50) return { grade: "C6", remark: "Credit", color: "gold" };
  if (score >= 45) return { grade: "D7", remark: "Pass", color: "amber" };
  if (score >= 40) return { grade: "E8", remark: "Pass", color: "amber" };
  return { grade: "F9", remark: "Fail", color: "red" };
}

/**
 * getInitials — used by the Avatar fallback. Takes the first letter of the
 * first two words so "Adunola Bakare" -> "AB".
 */
export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

/**
 * getErrorMessage — once axios is live, API errors arrive in a few shapes.
 * Centralising the extraction means every toast across the app reads the same.
 */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (typeof error === "string") return error;
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/** Human date — 12 Mar 2025 */
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/** Percentage with a single decimal, guarding divide-by-zero. */
export function percent(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT — Abuja"];
export const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-","Unknown"];
export const GENOTYPES = ["AA","AS","SS","AC","Unknown"];
export const RELIGIONS = ["Christianity","Islam","Traditional / African religion","Others"];
export const QUALIFICATIONS = ["SSCE / WAEC / NECO","OND","HND","NCE","B.Ed","B.Sc","B.A","B.Tech","PGDE","M.Ed","M.Sc","Ph.D","Others"];
export const SCHOOL_TYPES = ["Nursery only","Primary only","Secondary only","Nursery & Primary","Primary & Secondary","Nursery, Primary & Secondary"];
export const EMPLOYMENT_TYPES = ["Full-time","Part-time","Contract","NYSC / IT","Volunteer"];
export const STAFF_ROLES = ["Teacher","Senior Teacher","Head of Department","Class Teacher","School Admin","Bursar / Accountant","Librarian","Counsellor","Lab Technician","IT Staff","Security","Others"];
export const MARITAL_STATUS = ["Single","Married","Divorced","Widowed","Separated"];
