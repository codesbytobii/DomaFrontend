"use client";

import { forwardRef } from "react";

// ── helpers ────────────────────────────────────────────────────────────────
function ordinal(n) {
  if (!n) return "—";
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

const GRADE_REMARKS = {
  A1:"Excellent", B2:"Very Good", B3:"Good",
  C4:"Credit", C5:"Credit", C6:"Credit",
  D7:"Pass", E8:"Pass", F9:"Fail",
};

const GRADE_COLOR = {
  A1:"#0a5c2e", B2:"#1a6b3a", B3:"#2e7d4f",
  C4:"#7a5000", C5:"#7a5000", C6:"#7a5000",
  D7:"#555", E8:"#555", F9:"#b91c1c",
};

const SKILL_LABELS = ["—","Poor","Fair","Good","Very Good","Excellent"];

function StarRating({ value }) {
  return (
    <span style={{ fontWeight:700, fontSize:13, color: value >= 4 ? "#1a6b3a" : value >= 3 ? "#7a5000" : "#b91c1c" }}>
      {value || "—"}
      {value > 0 && <span style={{ fontSize:10, fontWeight:400, marginLeft:3, color:"#666" }}>({SKILL_LABELS[value]})</span>}
    </span>
  );
}

// ── main component ─────────────────────────────────────────────────────────
const ReportCard = forwardRef(function ReportCard({ child, school, term }, ref) {
  if (!child) return null;

  // Support both legacy tuple format and new object format
  const subjects = (child.results || []).map((r) => {
    if (Array.isArray(r)) {
      const [subject, ca1, ca2, exam] = r;
      const total = (ca1||0)+(ca2||0)+(exam||0);
      return { subject, ca1, ca2, exam, total, grade:"—", remark:"—", position:null, highest:0, lowest:0, class_avg:0 };
    }
    return r;
  });

  const summary   = child.summary || {};
  const att       = child.attendance || {};
  const skills    = child.skills || null;
  const remarks   = child.remarks || null;
  const isThird   = child.is_third_term || false;
  const cumAvg    = child.cumulative_average ?? null;
  const classInfo = child.class_info || {};

  const totalScore  = summary.total_score ?? subjects.reduce((s,r)=>s+(r.total||0),0);
  const obtainable  = summary.obtainable  ?? subjects.length * 100;
  const avg         = summary.average     ?? (subjects.length ? Math.round(totalScore/subjects.length*10)/10 : 0);
  const grade       = summary.grade       ?? "—";
  const position    = summary.position    ?? null;
  const classSize   = summary.class_size  ?? child.class_size ?? "—";

  const brandColor  = school?.brand_color || "#1a3a6b";
  const schoolName  = school?.name        || "School Name";
  const schoolAddr  = school?.address     || "";
  const schoolPhone = school?.phone       || "";
  const schoolEmail = school?.email       || "";
  const schoolMotto = school?.motto       || "";
  const logoUrl     = school?.logo_url    || null;
  const stampUrl    = school?.stamp_url   || null;

  const termLabel   = typeof term === "string" ? term : (child.term || "");
  const nextTerm    = remarks?.next_term_begins || child.next_term_begins || "";
  const formTeacher = classInfo.form_teacher || child.form_teacher || "";
  const className   = child.cls || summary.class || "";
  const daysOpened  = att.days_opened  ?? "—";
  const daysPresent = att.days_present ?? "—";
  const daysAbsent  = att.days_absent  ?? "—";

  const AFFECTIVE = [
    ["punctuality","Punctuality"],["neatness","Neatness"],["politeness","Politeness"],
    ["honesty","Honesty"],["reliability","Reliability"],["leadership","Leadership"],
    ["cooperation","Cooperation"],["self_control","Self Control"],
    ["responsibility","Responsibility"],["initiative","Initiative"],
    ["perseverance","Perseverance"],["attentiveness","Attentiveness"],
  ];
  const PSYCHOMOTOR = [
    ["handwriting","Handwriting"],["verbal_fluency","Verbal Fluency"],
    ["sports","Sports"],["artistic_creativity","Artistic Creativity"],
    ["handling_tools","Handling Tools"],["drawing_painting","Drawing & Painting"],
  ];
  const GRADING_KEY = [
    ["A1","75 – 100","Excellent"],["B2","70 – 74","Very Good"],
    ["B3","65 – 69","Good"],["C4","60 – 64","Credit"],
    ["C5","55 – 59","Credit"],["C6","50 – 54","Credit"],
    ["D7","45 – 49","Pass"],["E8","40 – 44","Pass"],
    ["F9","0 – 39","Fail"],
  ];

  const cell = (val, bold, color) => ({
    padding:"5px 6px", border:"1px solid #c8d0c4", textAlign:"center",
    fontSize:12, fontWeight: bold ? 700 : 400,
    color: color || "#111",
  });
  const hcell = (align="center") => ({
    padding:"6px 6px", border:"1px solid #adb8a8", textAlign:align,
    fontSize:10, fontWeight:700, background: brandColor, color:"#fff",
    textTransform:"uppercase", letterSpacing:"0.04em",
  });

  return (
    <div ref={ref} style={{
      background:"#fff", fontFamily:"Arial, sans-serif",
      width:"100%", maxWidth:820, margin:"0 auto",
      border:`2px solid ${brandColor}`, borderRadius:4,
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: brandColor, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
        {/* Logo */}
        <div style={{ width:70, height:70, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.15)", borderRadius:6, overflow:"hidden" }}>
          {logoUrl
            ? <img src={logoUrl} style={{ width:"100%", height:"100%", objectFit:"contain" }} alt="logo" />
            : <span style={{ fontSize:24, fontWeight:900, color:"#fff", fontFamily:"Georgia,serif" }}>{schoolName.charAt(0)}</span>
          }
        </div>

        {/* School info */}
        <div style={{ flex:1, textAlign:"center", color:"#fff" }}>
          <div style={{ fontSize:22, fontWeight:900, fontFamily:"Georgia,serif", letterSpacing:0.5 }}>
            {schoolName.toUpperCase()}
          </div>
          {schoolMotto && (
            <div style={{ fontSize:11, fontStyle:"italic", opacity:0.85, marginTop:2 }}>
              Motto: {schoolMotto}
            </div>
          )}
          {schoolAddr && <div style={{ fontSize:11, opacity:0.8, marginTop:1 }}>{schoolAddr}</div>}
          <div style={{ fontSize:11, opacity:0.8 }}>
            {schoolPhone && `Tel: ${schoolPhone}`}
            {schoolPhone && schoolEmail && " | "}
            {schoolEmail && `Email: ${schoolEmail}`}
          </div>
          <div style={{ marginTop:5, display:"inline-block", border:"1.5px solid rgba(255,255,255,0.7)", borderRadius:3, padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:1 }}>
            ★ STUDENT'S ACADEMIC REPORT CARD ★
          </div>
        </div>

        {/* Student photo placeholder */}
        <div style={{ width:70, height:80, flexShrink:0, border:"2px solid rgba(255,255,255,0.5)", borderRadius:4, background:"rgba(255,255,255,0.15)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.7)", textAlign:"center", lineHeight:1.3 }}>PASSPORT{"\n"}PHOTO</span>
        </div>
      </div>

      <div style={{ padding:"10px 14px" }}>

        {/* ── STUDENT INFO ───────────────────────────────────────────── */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:8, border:`1px solid ${brandColor}`, fontSize:12 }}>
          <tbody>
            <tr style={{ background:"#f0f5f0" }}>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4", width:"35%" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Name: </span>
                <span style={{ fontWeight:700, fontSize:13 }}>{child.name}</span>
              </td>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4", width:"20%" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Adm No: </span>
                <span style={{ fontFamily:"monospace" }}>{child.reg_number || "—"}</span>
              </td>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4", width:"15%" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Class: </span>
                <span style={{ fontWeight:700 }}>{className}</span>
              </td>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4", width:"15%" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Gender: </span>
                {child.gender || "—"}
              </td>
              <td style={{ padding:"5px 8px", width:"15%" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Position: </span>
                <span style={{ fontWeight:700, color: brandColor }}>{ordinal(position)} of {classSize}</span>
              </td>
            </tr>
            <tr>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Session: </span>
                {typeof termLabel === "string" && termLabel.includes("—") ? termLabel.split("—")[0].trim() : ""}
              </td>
              <td colSpan={2} style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Term: </span>
                <span style={{ fontWeight:700 }}>
                  {typeof termLabel === "string" && termLabel.includes("—") ? termLabel.split("—")[1]?.trim() : termLabel}
                </span>
              </td>
              <td colSpan={2} style={{ padding:"5px 8px" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Class Teacher: </span>
                {formTeacher || "—"}
              </td>
            </tr>
            <tr style={{ background:"#f0f5f0" }}>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Days in Term: </span>
                <span style={{ fontWeight:700 }}>{daysOpened}</span>
              </td>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Days Present: </span>
                <span style={{ fontWeight:700, color:"#1a6b3a" }}>{daysPresent}</span>
              </td>
              <td style={{ padding:"5px 8px", borderRight:"1px solid #c8d0c4" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Days Absent: </span>
                <span style={{ fontWeight:700, color: typeof daysAbsent === "number" && daysAbsent > 5 ? "#b91c1c" : "#333" }}>{daysAbsent}</span>
              </td>
              <td colSpan={2} style={{ padding:"5px 8px" }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>No. in Class: </span>
                {classSize}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── RESULTS TABLE ──────────────────────────────────────────── */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:8, fontSize:12 }}>
          <thead>
            <tr>
              <th style={{ ...hcell("left"), width:"24%" }}>Subject</th>
              <th style={hcell()}>1st CA (20)</th>
              <th style={hcell()}>2nd CA (20)</th>
              <th style={hcell()}>Exam (60)</th>
              <th style={hcell()}>Total (100)</th>
              <th style={hcell()}>Grade</th>
              <th style={hcell()}>Pos.</th>
              <th style={hcell()}>Highest</th>
              <th style={hcell()}>Lowest</th>
              <th style={hcell()}>Avg</th>
              {isThird && <th style={hcell()}>1st Tm</th>}
              {isThird && <th style={hcell()}>2nd Tm</th>}
              {isThird && <th style={hcell()}>3rd Tm</th>}
              {isThird && <th style={{ ...hcell(), background:"#2e7d4f" }}>Cum.</th>}
              <th style={hcell()}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((r, i) => {
              const gc = GRADE_COLOR[r.grade] || "#111";
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f7faf7" }}>
                  <td style={{ ...cell(null,false), textAlign:"left", fontWeight:600, paddingLeft:8 }}>{r.subject || r.name || "—"}</td>
                  <td style={cell(r.ca1)}>{r.ca1 ?? "—"}</td>
                  <td style={cell(r.ca2)}>{r.ca2 ?? "—"}</td>
                  <td style={cell(r.exam)}>{r.exam ?? "—"}</td>
                  <td style={{ ...cell(null,true), color: brandColor }}>{r.total ?? "—"}</td>
                  <td style={{ ...cell(null,true), color: gc }}>{r.grade || "—"}</td>
                  <td style={cell(null,false,"#555")}>{r.position ? ordinal(r.position) : "—"}</td>
                  <td style={cell(null,false,"#1a6b3a")}>{r.highest ?? "—"}</td>
                  <td style={cell(null,false,"#b91c1c")}>{r.lowest ?? "—"}</td>
                  <td style={cell()}>{r.class_avg ?? "—"}</td>
                  {isThird && <td style={cell(null,false,"#555")}>{r.term_totals?.[0]?.total ?? 0}</td>}
                  {isThird && <td style={cell(null,false,"#555")}>{r.term_totals?.[1]?.total ?? 0}</td>}
                  {isThird && <td style={cell(null,false,"#555")}>{r.term_totals?.[2]?.total ?? 0}</td>}
                  {isThird && <td style={{ ...cell(null,true), color:"#2e7d4f" }}>{r.cumulative ?? "—"}</td>}
                  <td style={{ ...cell(null,false), color: gc, fontSize:11 }}>{r.remark || GRADE_REMARKS[r.grade] || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── SUMMARY ROW ───────────────────────────────────────────── */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:10, border:`1.5px solid ${brandColor}`, background:"#f0f5f0" }}>
          <tbody>
            <tr>
              <td style={{ padding:"6px 10px", borderRight:"1px solid #adb8a8", fontSize:12 }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Total Score: </span>
                <span style={{ fontWeight:700, fontSize:14, color: brandColor }}>{totalScore}</span>
                <span style={{ fontSize:11, color:"#666" }}> / {obtainable}</span>
              </td>
              <td style={{ padding:"6px 10px", borderRight:"1px solid #adb8a8", fontSize:12 }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Average: </span>
                <span style={{ fontWeight:700, fontSize:14, color: brandColor }}>{avg}%</span>
              </td>
              <td style={{ padding:"6px 10px", borderRight:"1px solid #adb8a8", fontSize:12 }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Grade: </span>
                <span style={{ fontWeight:700, fontSize:14, color: GRADE_COLOR[grade] || "#111" }}>{grade}</span>
              </td>
              <td style={{ padding:"6px 10px", borderRight:"1px solid #adb8a8", fontSize:12 }}>
                <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Position: </span>
                <span style={{ fontWeight:700, fontSize:14, color: brandColor }}>{ordinal(position)}</span>
                <span style={{ fontSize:11, color:"#666" }}> of {classSize}</span>
              </td>
              {isThird && cumAvg !== null && (
                <td style={{ padding:"6px 10px", fontSize:12 }}>
                  <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:"#555" }}>Cumulative Avg: </span>
                  <span style={{ fontWeight:700, fontSize:14, color:"#2e7d4f" }}>{cumAvg}%</span>
                </td>
              )}
            </tr>
          </tbody>
        </table>

        {/* ── AFFECTIVE + PSYCHOMOTOR + GRADING ─────────────────────── */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:10, border:"1px solid #adb8a8", fontSize:12 }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ ...hcell(), width:"34%", borderRight:"1px solid rgba(255,255,255,0.3)" }}>Affective Domain</th>
              <th colSpan={2} style={{ ...hcell(), width:"30%", borderRight:"1px solid rgba(255,255,255,0.3)" }}>Psychomotor Skills</th>
              <th colSpan={2} style={{ ...hcell(), width:"36%" }}>Grading System</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(AFFECTIVE.length, PSYCHOMOTOR.length, GRADING_KEY.length) }).map((_, i) => {
              const aff = AFFECTIVE[i];
              const psy = PSYCHOMOTOR[i];
              const grd = GRADING_KEY[i];
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f7faf7" }}>
                  {/* Affective */}
                  {aff ? (
                    <>
                      <td style={{ padding:"4px 8px", borderRight:"1px solid #c8d0c4", borderBottom:"1px solid #e4ebe4", fontSize:11, color:"#333" }}>{aff[1]}</td>
                      <td style={{ padding:"4px 8px", borderRight:"2px solid #adb8a8", borderBottom:"1px solid #e4ebe4", textAlign:"center", width:80 }}>
                        {skills ? <StarRating value={skills[aff[0]]} /> : <span style={{ color:"#ccc" }}>—</span>}
                      </td>
                    </>
                  ) : (
                    <><td style={{ borderRight:"1px solid #c8d0c4", borderBottom:"1px solid #e4ebe4" }} /><td style={{ borderRight:"2px solid #adb8a8", borderBottom:"1px solid #e4ebe4" }} /></>
                  )}
                  {/* Psychomotor */}
                  {psy ? (
                    <>
                      <td style={{ padding:"4px 8px", borderRight:"1px solid #c8d0c4", borderBottom:"1px solid #e4ebe4", fontSize:11, color:"#333" }}>{psy[1]}</td>
                      <td style={{ padding:"4px 8px", borderRight:"2px solid #adb8a8", borderBottom:"1px solid #e4ebe4", textAlign:"center", width:80 }}>
                        {skills ? <StarRating value={skills[psy[0]]} /> : <span style={{ color:"#ccc" }}>—</span>}
                      </td>
                    </>
                  ) : (
                    <><td style={{ borderRight:"1px solid #c8d0c4", borderBottom:"1px solid #e4ebe4" }} /><td style={{ borderRight:"2px solid #adb8a8", borderBottom:"1px solid #e4ebe4" }} /></>
                  )}
                  {/* Grading key */}
                  {grd ? (
                    <>
                      <td style={{ padding:"4px 8px", borderRight:"1px solid #c8d0c4", borderBottom:"1px solid #e4ebe4", fontWeight:700, fontSize:11, color: GRADE_COLOR[grd[0]] || "#111" }}>{grd[0]}</td>
                      <td style={{ padding:"4px 8px", borderBottom:"1px solid #e4ebe4", fontSize:11, color:"#333" }}>{grd[1]} — {grd[2]}</td>
                    </>
                  ) : (
                    i === GRADING_KEY.length ? (
                      <>
                        <td colSpan={2} style={{ padding:"4px 8px", borderBottom:"1px solid #e4ebe4", fontSize:10, color:"#666", fontStyle:"italic" }}>
                          Scale: 5=Excellent · 4=Very Good · 3=Good · 2=Fair · 1=Poor
                        </td>
                      </>
                    ) : (
                      <><td style={{ borderRight:"1px solid #c8d0c4", borderBottom:"1px solid #e4ebe4" }} /><td style={{ borderBottom:"1px solid #e4ebe4" }} /></>
                    )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── REMARKS ───────────────────────────────────────────────── */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:10, border:"1px solid #adb8a8" }}>
          <tbody>
            <tr>
              <td style={{ padding:"7px 10px", borderRight:"1px solid #c8d0c4", width:"50%", fontSize:12 }}>
                <span style={{ fontWeight:700, textTransform:"uppercase", fontSize:10, color:"#555" }}>Class Teacher's Remark: </span>
                <span style={{ fontStyle: remarks?.teacher_remark ? "normal" : "italic", color: remarks?.teacher_remark ? "#111" : "#aaa" }}>
                  {remarks?.teacher_remark || "No remark entered"}
                </span>
              </td>
              <td style={{ padding:"7px 10px", fontSize:12 }}>
                <span style={{ fontWeight:700, textTransform:"uppercase", fontSize:10, color:"#555" }}>Principal's Remark: </span>
                <span style={{ fontStyle: remarks?.principal_remark ? "normal" : "italic", color: remarks?.principal_remark ? "#111" : "#aaa" }}>
                  {remarks?.principal_remark || "No remark entered"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SIGNATURES + STAMP ────────────────────────────────────── */}
        <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:8, border:"1px solid #adb8a8" }}>
          <tbody>
            <tr>
              <td style={{ padding:"8px 12px", borderRight:"1px solid #c8d0c4", width:"33%", textAlign:"center", fontSize:12 }}>
                <div style={{ height:36, borderBottom:"1px solid #888", marginBottom:4 }}></div>
                <span style={{ fontSize:10, textTransform:"uppercase", color:"#555", fontWeight:700 }}>Class Teacher's Signature</span>
              </td>
              <td style={{ padding:"8px 12px", borderRight:"1px solid #c8d0c4", width:"34%", textAlign:"center" }}>
                {stampUrl
                  ? <img src={stampUrl} style={{ width:60, height:60, objectFit:"contain", opacity:0.85 }} alt="stamp" />
                  : <div style={{ width:60, height:60, border:"1.5px dashed #ccc", borderRadius:"50%", margin:"0 auto 4px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#ccc" }}>STAMP</div>
                }
                <div style={{ fontSize:10, textTransform:"uppercase", color:"#555", fontWeight:700 }}>School Stamp</div>
              </td>
              <td style={{ padding:"8px 12px", width:"33%", textAlign:"center", fontSize:12 }}>
                <div style={{ height:36, borderBottom:"1px solid #888", marginBottom:4 }}></div>
                <span style={{ fontSize:10, textTransform:"uppercase", color:"#555", fontWeight:700 }}>Principal's Signature</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <div style={{ borderTop:`2px solid ${brandColor}`, paddingTop:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:11, color:"#555" }}>
            {nextTerm && (
              <span><span style={{ fontWeight:700 }}>Next Term Begins:</span> {nextTerm} &nbsp;|&nbsp;</span>
            )}
            <span style={{ fontWeight:700, color: brandColor }}>Result issued by {schoolName}</span>
          </div>
          <div style={{ fontSize:10, fontWeight:700, color:"#b91c1c", textTransform:"uppercase", letterSpacing:0.5 }}>
            ⚠ Any alteration on this result sheet renders it invalid
          </div>
        </div>

      </div>
    </div>
  );
});

export default ReportCard;