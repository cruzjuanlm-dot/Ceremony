import type { Client, Email, Vendor } from "~/data/types";

/** A conversation: every email sharing a `threadId`, oldest first. */
export interface Thread {
  id: string;
  emails: Email[];
  latest: Email;
  unread: number;
  hasSent: boolean;
  weddingId: string | null;
  vendorId: string | null;
  clientId: string | null;
}

/** Group the log into threads, newest activity first. */
export function groupThreads(emails: Email[]): Thread[] {
  const byId = new Map<string, Email[]>();
  for (const e of emails) {
    const list = byId.get(e.threadId);
    if (list) list.push(e);
    else byId.set(e.threadId, [e]);
  }
  const threads: Thread[] = [];
  for (const [id, list] of byId) {
    list.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    const latest = list[list.length - 1]!;
    threads.push({
      id,
      emails: list,
      latest,
      unread: list.filter((e) => e.direction === "in" && !e.read).length,
      hasSent: list.some((e) => e.direction === "out"),
      weddingId: list.find((e) => e.weddingId)?.weddingId ?? null,
      vendorId: list.find((e) => e.vendorId)?.vendorId ?? null,
      clientId: list.find((e) => e.clientId)?.clientId ?? null,
    });
  }
  return threads.sort((a, b) => b.latest.sentAt.localeCompare(a.latest.sentAt));
}

/** The other party in a thread — who the planner/couple is talking to. */
export function counterpart(
  t: Thread,
  vendors: Vendor[],
  clients: Client[],
): { name: string; email: string; kind: "vendor" | "client" | null } {
  const vendor = vendors.find((v) => v.id === t.vendorId);
  if (vendor) return { name: vendor.name, email: vendor.email, kind: "vendor" };
  const client = clients.find((c) => c.id === t.clientId);
  if (client) return { name: `${client.partner1} & ${client.partner2}`, email: client.email, kind: "client" };
  const inbound = t.emails.find((e) => e.direction === "in");
  if (inbound) return { name: inbound.fromName, email: inbound.fromEmail, kind: null };
  return { name: t.latest.to, email: t.latest.to, kind: null };
}

export const replySubject = (s: string) => (/^re:/i.test(s) ? s : `Re: ${s}`);

export const snippet = (body: string) => body.replace(/\s+/g, " ").trim();
