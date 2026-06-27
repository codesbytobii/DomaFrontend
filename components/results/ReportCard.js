"use client";

import { forwardRef } from "react";
import { getGrade } from "@/lib/utils";

/**
 * ReportCard — renders a student's term result in one of four template layouts.
 * Accepts the API-shaped child object (produced by the parent results page)
 * or the legacy mock shape. All nullable fields default gracefully.
 */
const GRADE_STYLE = {
  forest: { bg: "#EAF3EE", fg: "#124A29" }, gold: { bg: "#FDF6E9", fg: "#7A500D" },
  amber: { bg: "#FBEEDD", fg: "#915200" }, red: { bg: "#FCEBEB", fg: "#791F1F" }, gray: { bg: "#eee", fg: "#555" },
};

function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function computeRows(results = []) {
  return results.map(([name, ca1, ca2, exam]) => { const total = (ca1 || 0) + (ca2 || 0) + (exam || 0); return { name, ca1, ca2, exam, total, g: getGrade(total) }; });
}
function average(rows) { if (!rows.length) return 0; return Math.round((rows.reduce((s, r) => s + r.total, 0) / rows.length) * 10) / 10; }
function heuristicPosition(avg) { return avg >= 70 ? 4 : avg >= 60 ? 7 : 12; }

const ReportCard = forwardRef(function ReportCard({ child, base = "classic", school }, ref) {
  if (!child) return null;
  const rows = computeRows(child.results);
  const avg = average(rows);
  const pos = heuristicPosition(avg);
  const classSize = child.class_size != null ? child.class_size : "—";
  const attRate = child.attendance?.rate ?? "—";
  const remarkTeacher = child.remark_teacher || "";
  const remarkPrincipal = child.remark_principal || "";
  const meta = { term: "Second Term", session: "2024/2025", resumes: "3rd March 2025" };

  const Pill = ({ g }) => <span style={{ background: GRADE_STYLE[g.color].bg, color: GRADE_STYLE[g.color].fg, fontWeight: 700, fontSize: 12, padding: "2px 9px", borderRadius: 6 }}>{g.grade}</span>;

  let body;
  if (base === "minimal") {
    body = (
      <div style={{ padding: 34, color: "#222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #222", paddingBottom: 8 }}>
          <b style={{ fontSize: 17, letterSpacing: ".5px" }}>{(school?.name || "School").toUpperCase()}</b>
          <span style={{ fontSize: 12, color: "#666" }}>{meta.term} · {meta.session}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 13 }}><b>{child.name}</b> · {child.cls}</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 13 }}>
          <tbody>{rows.map((r) => (<tr key={r.name}><td style={{ padding: "6px 4px", borderBottom: "1px solid #eee" }}>{r.name}</td><td style={{ textAlign: "right", borderBottom: "1px solid #eee", fontWeight: 700 }}>{r.total}</td><td style={{ textAlign: "right", borderBottom: "1px solid #eee" }}>{r.g.grade}</td></tr>))}</tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: 13, display: "flex", gap: 16, borderTop: "2px solid #222", paddingTop: 8 }}>
          <span>Average <b>{avg}</b></span><span>Position <b>{ordinal(pos)}</b> / {classSize}</span><span>Attendance <b>{attRate}{typeof attRate === "number" ? "%" : ""}</b></span>
        </div>
        {remarkTeacher && <div style={{ marginTop: 10, fontSize: 12, color: "#444" }}><b>Remark:</b> {remarkTeacher}</div>}
      </div>
    );
  } else if (base === "modern" || base === "branded") {
    const accent = base === "branded" ? "#7A1F5C" : "#1B6B3A";
    const soft = base === "branded" ? "#F6E8F1" : "#EAF3EE";
    body = (
      <div style={{ padding: 36, position: "relative" }}>
        {base === "branded" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", opacity: 0.05, fontSize: 96, fontWeight: 700, fontFamily: "Playfair Display, serif", color: accent }}>GA</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 13, borderBottom: `2px solid ${accent}`, paddingBottom: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, background: accent, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "Playfair Display, serif" }}>GA</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 23, fontWeight: 700, color: accent, fontFamily: "Playfair Display, serif" }}>{school?.name || "School"}</div><div style={{ fontSize: 13, color: "#6b7770" }}>{meta.term} · {meta.session}</div></div>
        </div>
        <div style={{ marginTop: 13 }}><div style={{ fontSize: 19, fontWeight: 600, fontFamily: "Playfair Display, serif" }}>{child.name}</div><div style={{ fontSize: 13, color: "#6b7770" }}>{child.cls}</div></div>
        <div style={{ display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
          {[["Average", avg], ["Position", ordinal(pos)], ["Attendance", `${attRate}${typeof attRate === "number" ? "%" : ""}`]].map(([l, v]) => (
            <div key={l} style={{ flex: 1, minWidth: 100, background: soft, borderRadius: 11, padding: "12px 14px" }}><div style={{ fontSize: 12, color: "#6b7770" }}>{l}</div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Playfair Display, serif" }}>{v}</div></div>))}
        </div>
        <div style={{ border: "1px solid #E7E9E4", borderRadius: 11, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: soft, color: accent }}><th style={{ padding: "8px 12px", textAlign: "left" }}>Subject</th><th>Total</th><th>Grade</th></tr></thead>
            <tbody>{rows.map((r, i) => (<tr key={r.name} style={{ background: i % 2 ? "#FAFAF7" : "#fff" }}><td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.name}</td><td style={{ textAlign: "center", fontWeight: 700 }}>{r.total}</td><td style={{ textAlign: "center" }}><Pill g={r.g} /></td></tr>))}</tbody>
          </table>
        </div>
        {(remarkTeacher || remarkPrincipal) && <div style={{ marginTop: 13, background: "#FAFAF7", borderRadius: 11, padding: "12px 14px", fontSize: 13 }}><b style={{ color: accent }}>Remark:</b> {remarkTeacher} {remarkPrincipal}</div>}
      </div>
    );
  } else {
    // classic
    body = (
      <div style={{ padding: 36, fontFamily: "Georgia, serif" }}>
        <div style={{ textAlign: "center", borderBottom: "3px double #124A29", paddingBottom: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#124A29", fontFamily: "Playfair Display, serif" }}>{school?.name || "School"}</div>
          {school?.address && <div style={{ fontSize: 12, color: "#555" }}>{school.address}</div>}
          <div style={{ marginTop: 8, fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>{meta.term.toUpperCase()} REPORT · {meta.session}</div>
        </div>
        <div style={{ fontSize: 13, margin: "12px 0" }}><b>Name:</b> {child.name} &nbsp; <b>Class:</b> {child.cls}</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "center" }}>
          <thead><tr style={{ background: "#EAF3EE" }}>{["Subject", "CA1", "CA2", "Exam", "Total", "Grade"].map((h, i) => <th key={h} style={{ border: "1px solid #cfd5cc", padding: 6, textAlign: i === 0 ? "left" : "center" }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => (<tr key={r.name}><td style={{ textAlign: "left", padding: "5px 8px", border: "1px solid #cfd5cc" }}>{r.name}</td><td style={{ border: "1px solid #cfd5cc" }}>{r.ca1}</td><td style={{ border: "1px solid #cfd5cc" }}>{r.ca2}</td><td style={{ border: "1px solid #cfd5cc" }}>{r.exam}</td><td style={{ border: "1px solid #cfd5cc", fontWeight: 700 }}>{r.total}</td><td style={{ border: "1px solid #cfd5cc" }}>{r.g.grade}</td></tr>))}</tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: 13 }}><b>Position:</b> {ordinal(pos)} of {classSize} &nbsp;&nbsp; <b>Average:</b> {avg} &nbsp;&nbsp; <b>Attendance:</b> {attRate}{typeof attRate === "number" ? "%" : ""}</div>
        {(remarkTeacher || remarkPrincipal) && <div style={{ marginTop: 12, fontSize: 13 }}><b>Class Teacher:</b> {remarkTeacher}<br /><b>Principal:</b> {remarkPrincipal}</div>}
        {school?.motto && <div style={{ marginTop: 14, fontSize: 12, color: "#555", borderTop: "1px solid #d8ddd5", paddingTop: 8 }}>Next term begins {meta.resumes} · {school.motto}</div>}
      </div>
    );
  }

  return <div ref={ref} style={{ background: "#fff", borderRadius: 8 }}>{body}</div>;
});

export default ReportCard;
