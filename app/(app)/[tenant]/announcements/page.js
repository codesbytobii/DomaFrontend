"use client";

import { Megaphone } from "lucide-react";
import { useAnnouncements } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";

export default function AnnouncementsPage() {
  const { items, isLoading } = useAnnouncements();
  return (
    <div>
      <PageHeader title="Announcements" subtitle="Updates from your school" />
      {isLoading && <p className="text-sm text-ink/45">Loading…</p>}
      {!isLoading && items.length === 0 && <Card className="p-8 text-center text-ink/45">No announcements yet.</Card>}
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-forest-50 text-forest-600"><Megaphone size={18} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg text-ink">{a.title}</h3>
                  <Badge tone="forest">{a.channel}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink/70">{a.body}</p>
                <p className="mt-2 text-xs text-ink/45">{a.sent_by} · {formatDate(a.sent_at)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
