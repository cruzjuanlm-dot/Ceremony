import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { EmptyState } from "~/components/kit";
import { NewEmailButton } from "~/components/inbox/new-email-dialog";
import { ThreadRow, ThreadView } from "~/components/inbox/thread-view";
import { groupThreads } from "~/components/inbox/threads";
import { useRows, useUpdate, useWorkspace } from "~/data/hooks";
import { cn, PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/inbox")({
  component: InboxPage,
});

type Filter = "all" | "unread" | "sent";

function InboxPage() {
  const ws = useWorkspace();
  const emails = useRows("emails");
  const weddings = useRows("weddings");
  const update = useUpdate("emails");
  const [filter, setFilter] = useState<Filter>("all");
  const [weddingId, setWeddingId] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const threads = useMemo(() => groupThreads(emails), [emails]);
  const unreadTotal = threads.reduce((n, t) => n + t.unread, 0);
  const visible = threads.filter((t) => {
    if (filter === "unread" && t.unread === 0) return false;
    if (filter === "sent" && !t.hasSent) return false;
    if (weddingId !== "all" && t.weddingId !== weddingId) return false;
    return true;
  });
  const selected = threads.find((t) => t.id === selectedId) ?? null;

  // Opening a thread marks its inbound messages read.
  const { mutate } = update;
  useEffect(() => {
    if (!selected) return;
    for (const e of selected.emails) {
      if (e.direction === "in" && !e.read) mutate({ id: e.id, patch: { read: true } });
    }
  }, [selected, mutate]);

  const pro = ws.plan === "pro";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Email log"
        description={unreadTotal ? `${unreadTotal} unread` : "All caught up"}
        actions={<NewEmailButton onCreated={setSelectedId} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedControl
          aria-label="Which emails"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "sent", label: "Sent" },
          ]}
        />
        {pro && (
          <Select value={weddingId} onValueChange={setWeddingId}>
            <SelectTrigger className="h-8 w-52" aria-label="Wedding">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All weddings</SelectItem>
              {weddings.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {threads.length === 0 ? (
        <EmptyState title="No emails yet" action={<NewEmailButton onCreated={setSelectedId} />}>
          Log a message to a vendor{pro ? " or client" : ""} to keep the conversation with the wedding.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card md:grid md:h-[calc(100vh-15rem)] md:min-h-[480px] md:grid-cols-[minmax(280px,380px)_1fr]">
          <div className={cn("min-h-0 overflow-y-auto md:border-r", selected && "hidden md:block")}>
            {visible.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {filter === "unread" ? "No unread emails" : "No emails match"}
              </p>
            ) : (
              visible.map((t) => (
                <ThreadRow
                  key={t.id}
                  thread={t}
                  wedding={weddings.find((w) => w.id === t.weddingId)}
                  selected={t.id === selectedId}
                  onSelect={() => setSelectedId(t.id)}
                  showWedding={pro}
                />
              ))
            )}
          </div>
          <div className={cn("min-h-0 flex-col", selected ? "flex" : "hidden md:flex")}>
            {selected ? (
              <ThreadView key={selected.id} thread={selected} onBack={() => setSelectedId(null)} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-6 w-6" aria-hidden />
                Select a conversation
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3">
        <div>
          <div className="text-sm font-medium">Connect Gmail / Outlook</div>
          <div className="text-xs text-muted-foreground">Send from your own address and log replies automatically.</div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Coming soon
        </Button>
      </div>
    </div>
  );
}
