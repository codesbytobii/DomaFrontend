"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useStore } from "@/lib/store";
import { useClasses, useStudents, runPromotion } from "@/lib/api";
import { getErrorMessage, cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";

export default function PromotionsPage() {
  const role = useStore((s) => s.user?.role);
  const { items: classes, isLoading } = useClasses();
  const [curId, setCurId] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [running, setRunning] = useState(false);

  const cls = classes.find((c) => c.id === curId) || classes[0];
  const exit = cls?.next_class_label === "Graduated" || !cls?.next_class_label;

  const { items: students, isLoading: studentsLoading } = useStudents(
    cls?.label ? { class: cls.label, per_page: 100 } : null
  );

  const decisionFor = (id) => decisions[id] || (exit ? "graduate" : "promote");
  const setDecision = (id, d) => setDecisions((prev) => ({ ...prev, [id]: d }));

  const counts = useMemo(() => students.reduce((acc, s) => {
    const d = decisionFor(s.id); acc[d] = (acc[d] || 0) + 1; return acc;
  }, {}), [students, decisions]);

  if (role !== "school_admin") return <div className="text-sm text-ink/55">Promotions are managed by the school administrator.</div>;
  if (isLoading) return <div className="text-sm text-ink/55">Loading classes…</div>;

  const run = async () => {
    if (!cls) return;
    setRunning(true);
    try {
      const decisionList = students.map((s) => ({ student_id: s.id, action: decisionFor(s.id) }));
      const res = await runPromotion(cls.id, decisionList);
      toast.success(`Done: ${res.promoted || 0} promoted · ${res.graduated || 0} graduated · ${res.repeated || 0} repeating`);
      setDecisions({});
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setRunning(false); }
  };

  return (
    <div>
      <PageHeader title="Promote students" subtitle="End-of-session — move each class to the next" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[230px_1fr]">
        <Card className="h-fit p-2">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink/40">Select a class</p>
          {classes.map((c) => (
            <button key={c.id} onClick={() => { setCurId(c.id); setDecisions({}); }}
              className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm", c.id === (cls?.id) ? "bg-forest-50 font-medium text-forest-800" : "text-ink/70 hover:bg-paper")}>
              <span>{c.label}</span><span className="text-xs text-ink/40">{c.students ?? ""}</span>
            </button>
          ))}
        </Card>

        <div>
          {cls && (
            <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
              <div className="text-sm"><b>{cls.label}</b> <span className="text-ink/55">moves to</span> <b>{exit ? "Graduated" : cls.next_class_label}</b></div>
              <div className="ml-auto flex flex-wrap gap-2 text-xs">
                {!exit && <span className="rounded-lg bg-forest-50 px-2.5 py-1.5 font-medium text-forest-700">{counts.promote || 0} promoting</span>}
                {exit && <span className="rounded-lg bg-gold-50 px-2.5 py-1.5 font-medium text-gold-600">{counts.graduate || 0} graduating</span>}
                <span className="rounded-lg bg-red-50 px-2.5 py-1.5 font-medium text-red-700">{counts.repeat || 0} repeating</span>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <Table>
              <THead><TR><TH>Student</TH><TH>Reg number</TH><TH className="text-right">Decision</TH></TR></THead>
              <TBody>
                {studentsLoading && <TR><TD colSpan={3} className="py-8 text-center text-ink/45">Loading students…</TD></TR>}
                {!studentsLoading && students.length === 0 && <TR><TD colSpan={3} className="py-8 text-center text-ink/45">Select a class to continue.</TD></TR>}
                {students.map((s) => {
                  const d = decisionFor(s.id);
                  return (
                    <TR key={s.id}>
                      <TD className="font-medium text-ink">{s.name}</TD>
                      <TD className="text-ink/55">{s.reg_number}</TD>
                      <TD>
                        <div className="flex justify-end gap-1.5">
                          {exit ? <Seg active={d === "graduate"} tone="gold" onClick={() => setDecision(s.id, "graduate")}>Graduate</Seg>
                               : <Seg active={d === "promote"} tone="forest" onClick={() => setDecision(s.id, "promote")}>Promote</Seg>}
                          <Seg active={d === "repeat"} tone="red" onClick={() => setDecision(s.id, "repeat")}>Repeat</Seg>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Card>
          {cls && <div className="mt-4 flex justify-end"><Button onClick={run} disabled={running}>{running ? "Running…" : `Run promotion for ${cls.label}`}</Button></div>}
        </div>
      </div>
    </div>
  );
}

function Seg({ active, tone, children, onClick }) {
  const tones = { forest: "bg-forest-500 text-white border-forest-500", gold: "bg-gold-400 text-ink border-gold-400", red: "bg-red-600 text-white border-red-600" };
  return <button onClick={onClick} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold", active ? tones[tone] : "border-line bg-white text-ink/55 hover:bg-paper")}>{children}</button>;
}
