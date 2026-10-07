import type { Appointment, Booking, Payment, Task, Vendor, Wedding } from "~/data/types";
import { addDaysIso, paymentState, type PaymentState } from "~/lib/finance";

/**
 * Everything the calendar shows, flattened to one shape. Weddings, appointments, task due
 * dates and payment due dates each keep a pointer to their row so a click can route to it.
 */

export type CalKind = "wedding" | "appointment" | "task" | "payment";
export type CalFilter = "all" | "wedding" | "appointment" | "task" | "payment";

interface Base {
  id: string;
  day: string; // YYYY-MM-DD
  /** "HH:MM" when the item has a clock time. */
  time: string | null;
  title: string;
  weddingId: string | null;
  weddingTitle: string | null;
}

export type CalItem =
  | (Base & { kind: "wedding"; wedding: Wedding })
  | (Base & { kind: "appointment"; appointment: Appointment })
  | (Base & { kind: "task"; task: Task })
  | (Base & { kind: "payment"; payment: Payment; state: PaymentState; payee: string });

/** Local calendar day + "HH:MM" of an ISO instant. */
export function localParts(isoInstant: string): { day: string; time: string } {
  const d = new Date(isoInstant);
  const p = (n: number) => String(n).padStart(2, "0");
  return { day: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

export function buildItems(input: {
  weddings: Wedding[];
  appointments: Appointment[];
  tasks: Task[];
  payments: Payment[];
  bookings: Booking[];
  vendors: Vendor[];
  today: string;
}): CalItem[] {
  const { weddings, appointments, tasks, payments, bookings, vendors, today } = input;
  const wTitle = new Map(weddings.map((w) => [w.id, w.title]));
  const vendorOf = (bookingId: string | null) => {
    const b = bookings.find((x) => x.id === bookingId);
    return vendors.find((v) => v.id === b?.vendorId)?.name ?? null;
  };
  const out: CalItem[] = [];

  for (const w of weddings) {
    if (!w.date) continue;
    out.push({ kind: "wedding", id: `w_${w.id}`, day: w.date, time: w.ceremonyTime, title: w.title, weddingId: w.id, weddingTitle: w.title, wedding: w });
  }
  for (const a of appointments) {
    const { day, time } = localParts(a.start);
    out.push({
      kind: "appointment",
      id: `a_${a.id}`,
      day,
      time,
      title: a.title,
      weddingId: a.weddingId,
      weddingTitle: a.weddingId ? (wTitle.get(a.weddingId) ?? null) : null,
      appointment: a,
    });
  }
  for (const t of tasks) {
    if (!t.dueDate) continue;
    out.push({
      kind: "task",
      id: `t_${t.id}`,
      day: t.dueDate,
      time: null,
      title: t.title,
      weddingId: t.weddingId,
      weddingTitle: t.weddingId ? (wTitle.get(t.weddingId) ?? null) : null,
      task: t,
    });
  }
  for (const p of payments) {
    // Paid installments are history, not plans.
    if (p.paidDate) continue;
    const payee = p.direction === "incoming" ? "Planning fee" : (vendorOf(p.bookingId) ?? "Vendor");
    out.push({
      kind: "payment",
      id: `p_${p.id}`,
      day: p.dueDate,
      time: null,
      title: `${payee} · ${p.label}`,
      weddingId: p.weddingId,
      weddingTitle: wTitle.get(p.weddingId) ?? null,
      payment: p,
      state: paymentState(p, today),
      payee,
    });
  }

  const order: Record<CalKind, number> = { wedding: 0, appointment: 1, payment: 2, task: 3 };
  return out.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      order[a.kind] - order[b.kind] ||
      (a.time ?? "99").localeCompare(b.time ?? "99") ||
      a.title.localeCompare(b.title),
  );
}

export const matchesFilter = (i: CalItem, f: CalFilter) => f === "all" || i.kind === f;

/* ---------- month grid date math (US weeks: Sunday first) ----------------------------- */

export function monthKey(isoDay: string) {
  return isoDay.slice(0, 7); // YYYY-MM
}

export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** The 5 or 6 Sunday-first weeks covering the month, as YYYY-MM-DD days. */
export function monthWeeks(key: string): string[][] {
  const [y, m] = key.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = addDaysIso(`${key}-01`, -first.getDay());
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  const weeks: string[][] = [];
  for (let i = 0; i < cells; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, j) => addDaysIso(start, i + j)));
  }
  return weeks;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
