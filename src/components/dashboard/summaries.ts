import type { Booking, Client, Email, Guest, Payment, Task, Vendor, Wedding } from "~/data/types";
import { guestSummary, paymentState, paymentTotals, type PaymentTotals } from "~/lib/finance";

/**
 * Per-wedding roll-ups for the dashboard. Pure selectors over rows the page already read —
 * money totals come from finance.ts, this file only filters and sorts.
 */

export interface WeddingSnapshot {
  wedding: Wedding;
  client: Client | null;
  venue: Vendor | null;
  openTasks: Task[];
  overdueTasks: number;
  latestInbound: Email | null;
  /** Pro: the planner's own fee from the couple. */
  fee: PaymentTotals & { count: number; paidCount: number };
  /** Cash owed to vendors. */
  vendorPay: PaymentTotals;
  bookedVendors: number;
  activeVendors: number;
  rsvpPending: number;
  invited: number;
}

export interface DashboardRows {
  clients: Client[];
  vendors: Vendor[];
  bookings: Booking[];
  payments: Payment[];
  tasks: Task[];
  emails: Email[];
  guests: Guest[];
}

export function snapshot(w: Wedding, rows: DashboardRows, today: string): WeddingSnapshot {
  const tasks = rows.tasks.filter((t) => t.weddingId === w.id && !t.done);
  const openTasks = [...tasks].sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const pays = rows.payments.filter((p) => p.weddingId === w.id);
  const incoming = pays.filter((p) => p.direction === "incoming");
  const outgoing = pays.filter((p) => p.direction === "outgoing");
  const bookings = rows.bookings.filter((b) => b.weddingId === w.id && b.stage !== "declined");
  const inbound = rows.emails
    .filter((e) => e.weddingId === w.id && e.direction === "in")
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const g = guestSummary(rows.guests.filter((x) => x.weddingId === w.id));
  return {
    wedding: w,
    client: rows.clients.find((c) => c.id === w.clientId) ?? null,
    venue: rows.vendors.find((v) => v.id === w.venueId) ?? null,
    openTasks,
    overdueTasks: openTasks.filter((t) => t.dueDate != null && t.dueDate < today).length,
    latestInbound: inbound[0] ?? null,
    fee: {
      ...paymentTotals(incoming, today),
      count: incoming.length,
      paidCount: incoming.filter((p) => paymentState(p, today) === "paid").length,
    },
    vendorPay: paymentTotals(outgoing, today),
    bookedVendors: bookings.filter((b) => b.stage === "booked").length,
    activeVendors: bookings.length,
    rsvpPending: g.pending,
    invited: g.invited,
  };
}

/** Sort key for "needs attention": the closest date first, undated last. */
export const byDate = (a: Wedding, b: Wedding) => (a.date ?? "9999").localeCompare(b.date ?? "9999");
