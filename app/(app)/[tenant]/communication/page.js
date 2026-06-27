"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send, MessageSquare, Users } from "lucide-react";
import { useAnnouncements, sendAnnouncement } from "@/lib/api";
import { formatDate, getErrorMessage } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card, { CardHeader, CardBody, CardTitle } from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Badge from "@/components/shared/Badge";

const CHANNELS = [
  { key: "SMS", label: "SMS", icon: MessageSquare },
  { key: "In-app", label: "In-app", icon: Users },
  { key: "SMS + In-app", label: "SMS + In-app", icon: Send },
];

export default function CommunicationPage() {
  const [channel, setChannel] = useState("In-app");
  const [form, setForm] = useState({ title: "", audience: "all", body: "" });
  const [sending, setSending] = useState(false);
  const { items: sent, isLoading, mutate } = useAnnouncements();

  const charCount = form.body.length;
  const smsPages = Math.max(1, Math.ceil(charCount / 160));

  const send = async () => {
    if (!form.title || !form.body) return toast.error("Add a title and message");
    setSending(true);
    try {
      await sendAnnouncement({ title: form.title, body: form.body, channel, audience: form.audience });
      toast.success(`"${form.title}" sent via ${channel}`);
      setForm({ title: "", audience: "all", body: "" });
      mutate();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  return (
    <div>
      <PageHeader title="Communication" subtitle="Reach parents and staff over SMS and in-app" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Compose message</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Title" name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-Term Break" />
              <Select label="Recipients" options={[{ value: "all", label: "All Parents" }, { value: "parents", label: "Parents only" }, { value: "staff", label: "All Staff" }]} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Message</label>
              <textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Type your message…" className="w-full rounded-lg border border-line bg-white p-3 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-forest-300" />
              <div className="mt-1 flex justify-between text-xs text-ink/45">
                <span>{charCount} characters</span>
                {channel.includes("SMS") && <span>{smsPages} SMS page{smsPages > 1 ? "s" : ""} per recipient</span>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Channel</label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setChannel(key)}
                    className={"inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors " +
                      (channel === key ? "border-forest-300 bg-forest-50 text-forest-700" : "border-line text-ink/55 hover:bg-paper")}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={send} disabled={sending}><Send size={16} /> {sending ? "Sending…" : "Send message"}</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sent messages</CardTitle></CardHeader>
          <CardBody className="space-y-3 p-4">
            {isLoading && <p className="text-sm text-ink/45">Loading…</p>}
            {!isLoading && sent.length === 0 && <p className="text-sm text-ink/45">No messages yet.</p>}
            {sent.map((a) => (
              <div key={a.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{a.title}</p>
                  <Badge tone="forest">{a.recipients_count}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink/55">{a.body}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-ink/40">
                  <span>{a.channel}</span><span>{formatDate(a.sent_at)}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
