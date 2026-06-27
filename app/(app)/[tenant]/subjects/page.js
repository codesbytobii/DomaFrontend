"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { useSubjects, createSubject } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import { Table, THead, TBody, TR, TH, TD } from "@/components/shared";
import api from "@/lib/axios";

export default function SubjectsPage() {
  const { items, isLoading, mutate } = useSubjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("Subject name is required");
    setLoading(true);
    try {
      await createSubject({ name: form.name.trim(), code: form.code.trim() || null });
      toast.success(`${form.name} created`);
      setForm({ name: "", code: "" });
      setOpen(false);
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subject) => {
    if (!confirm(`Remove "${subject.name}"? This will also remove it from any classes it is assigned to.`)) return;
    setDeleting(subject.id);
    try {
      await api.delete(`/subjects/${subject.id}`);
      toast.success(`${subject.name} removed`);
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle={`${items.length} subject${items.length !== 1 ? "s" : ""} created for this school`}
      >
        <Button size="md" onClick={() => setOpen(true)}>
          <Plus size={16} /> Add subject
        </Button>
      </PageHeader>

      <div className="mb-4 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink/55">
        These are your school-wide subjects. After creating them here, go to
        <strong className="text-ink"> Classes</strong> and assign the right subjects to each class.
        Only assigned subjects will appear when entering results.
      </div>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>#</TH>
              <TH>Subject name</TH>
              <TH>Code</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading && (
              <TR>
                <TD colSpan={4} className="py-10 text-center text-ink/45">
                  Loading subjects…
                </TD>
              </TR>
            )}
            {!isLoading && items.length === 0 && (
              <TR>
                <TD colSpan={4} className="py-10 text-center text-ink/45">
                  No subjects yet. Click <strong>Add subject</strong> to create your first one.
                </TD>
              </TR>
            )}
            {items.map((s, i) => (
              <TR key={s.id}>
                <TD className="text-ink/40">{i + 1}</TD>
                <TD className="font-medium text-ink">{s.name}</TD>
                <TD>
                  {s.code
                    ? <span className="font-mono text-xs text-ink/55">{s.code}</span>
                    : <span className="text-ink/30">—</span>
                  }
                </TD>
                <TD className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(s)}
                    disabled={deleting === s.id}
                  >
                    <Trash2 size={14} className="text-red-400" />
                    {deleting === s.id ? "Removing…" : "Remove"}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setForm({ name: "", code: "" }); }}
        title="Add subject"
        footer={
          <>
            <Button variant="subtle" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Saving…" : "Save subject"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Subject name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Mathematics, English Language, Basic Science"
          />
          <Input
            label="Subject code (optional)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. MTH, ENG, BSC"
            hint="A short code used on report cards and result sheets"
          />
        </div>
      </Modal>
    </div>
  );
}