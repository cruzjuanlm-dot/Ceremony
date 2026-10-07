import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Textarea } from "@libretto-ui/textarea";

import { Chip } from "~/components/kit";
import { useInsert, useRows, useWorkspace } from "~/data/hooks";
import type { Wedding } from "~/data/types";
import { dateTimeShort, relativeTime } from "~/lib/format";
import { cn } from "~/shared/libretto";

import { counterpart, replySubject, snippet, type Thread } from "./threads";

export const DemoSendChip = () => <Chip tone="warn">Demo — saved to the log, not sent</Chip>;

export function ThreadRow({
  thread,
  wedding,
  selected,
  onSelect,
  showWedding,
}: {
  thread: Thread;
  wedding: Wedding | undefined;
  selected: boolean;
  onSelect: () => void;
  showWedding: boolean;
}) {
  const vendors = useRows("vendors");
  const clients = useRows("clients");
  const who = counterpart(thread, vendors, clients);
  const unread = thread.unread > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        "flex w-full gap-2.5 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
        selected && "bg-muted",
      )}
    >
      <span className="mt-1.5 w-2 shrink-0">
        {unread && <span className="block h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
            {who.name}
            {thread.emails.length > 1 && (
              <span className="ml-1 font-normal text-muted-foreground">{thread.emails.length}</span>
            )}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relativeTime(thread.latest.sentAt)}</span>
        </span>
        <span className={cn("block truncate text-sm", unread ? "font-semibold" : "text-foreground/90")}>
          {thread.latest.subject}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {thread.latest.direction === "out" && "You: "}
          {snippet(thread.latest.body)}
        </span>
        {(who.kind || (showWedding && wedding)) && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {showWedding && wedding && <Chip tone="brand">{wedding.title}</Chip>}
            {who.kind && <Chip>{who.kind === "vendor" ? "Vendor" : "Client"}</Chip>}
          </span>
        )}
      </span>
    </button>
  );
}

export function ThreadView({ thread, onBack }: { thread: Thread; onBack: () => void }) {
  const ws = useWorkspace();
  const vendors = useRows("vendors");
  const clients = useRows("clients");
  const weddings = useRows("weddings");
  const who = counterpart(thread, vendors, clients);
  const wedding = weddings.find((w) => w.id === thread.weddingId);
  const subject = thread.emails[0]!.subject;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-4 py-3 sm:px-6">
        <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-8 px-2 text-muted-foreground md:hidden" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-lg font-semibold leading-snug">{subject}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">{who.name}</span>
          {wedding && ws.plan === "pro" && (
            <Link
              to="/weddings/$weddingId"
              params={{ weddingId: wedding.id }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {wedding.title}
            </Link>
          )}
          {who.kind === "vendor" && (
            <Link to="/vendors" className="text-primary underline-offset-4 hover:underline">
              Vendor
            </Link>
          )}
          {who.kind === "client" && (
            <Link to="/clients" className="text-primary underline-offset-4 hover:underline">
              Client
            </Link>
          )}
        </div>
      </div>

      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
        {thread.emails.map((e) => {
          const out = e.direction === "out";
          return (
            <li key={e.id} className={cn("rounded-lg border p-4", out ? "bg-accent/40" : "bg-card")}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                {out ? (
                  <ArrowUpRight className="h-3.5 w-3.5 self-center text-muted-foreground" aria-hidden />
                ) : (
                  <ArrowDownLeft className="h-3.5 w-3.5 self-center text-muted-foreground" aria-hidden />
                )}
                <span className="font-medium">{out ? "You" : e.fromName}</span>
                <span className="text-xs text-muted-foreground">
                  {out ? `to ${e.to}` : e.fromEmail}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{dateTimeShort(e.sentAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{e.body}</p>
            </li>
          );
        })}
      </ol>

      <ReplyComposer thread={thread} to={who.email} />
    </div>
  );
}

function ReplyComposer({ thread, to }: { thread: Thread; to: string }) {
  const ws = useWorkspace();
  const insert = useInsert("emails");
  const [body, setBody] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await insert.mutateAsync({
      threadId: thread.id,
      weddingId: thread.weddingId,
      vendorId: thread.vendorId,
      clientId: thread.clientId,
      direction: "out",
      fromName: ws.ownerName,
      fromEmail: ws.ownerEmail,
      to,
      subject: replySubject(thread.emails[0]!.subject),
      body: body.trim(),
      sentAt: new Date().toISOString(),
      read: true,
    });
    setBody("");
  }

  return (
    <form onSubmit={submit} className="border-t px-4 py-3 sm:px-6">
      <Textarea
        aria-label="Reply"
        placeholder={`Reply to ${to}`}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <DemoSendChip />
        <Button type="submit" size="sm" disabled={!body.trim() || insert.isPending}>
          Reply
        </Button>
      </div>
    </form>
  );
}
