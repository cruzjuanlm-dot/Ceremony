import type { Client, DocumentKind, DocumentRecord, DocumentStatus, Vendor } from "~/data/types";

export const DOC_KINDS: DocumentKind[] = ["contract", "proposal", "invoice", "insurance", "license", "floor_plan", "other"];
export const DOC_STATUSES: DocumentStatus[] = ["draft", "sent", "signed", "paid", "expired", "filed"];

/** "Needs action" = still moving: drafted but not out, or out but not back. */
export const needsAction = (d: DocumentRecord) => d.status === "draft" || d.status === "sent";
export const isDone = (d: DocumentRecord) => d.status === "signed" || d.status === "filed" || d.status === "paid";

/** Who's on the other side of the document — a vendor or (Pro) the client couple. */
export function partyName(d: DocumentRecord, vendors: Vendor[], clients: Client[]): string | null {
  const v = vendors.find((x) => x.id === d.vendorId);
  if (v) return v.name;
  const c = clients.find((x) => x.id === d.clientId);
  if (c) return `${c.partner1} & ${c.partner2}`;
  return null;
}

/** Encodes the party picker's value: "v:<id>" / "c:<id>" / "". */
export function parseParty(value: string): { vendorId: string | null; clientId: string | null } {
  if (value.startsWith("v:")) return { vendorId: value.slice(2), clientId: null };
  if (value.startsWith("c:")) return { vendorId: null, clientId: value.slice(2) };
  return { vendorId: null, clientId: null };
}

/** Only http(s) links are ever rendered as clickable — never `javascript:` or `data:`. */
export function safeUrl(url: string): string | null {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : null;
}
