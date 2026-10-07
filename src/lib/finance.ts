import type { BudgetLine, Booking, Guest, Payment } from "~/data/types";

/**
 * Ceremony's money math — the ONE place it lives (same rule as Libretto's finance.ts).
 * Components import from here; they never sum budget lines or payments themselves.
 *
 * Rules:
 *  - Every budget line carries estimate AND actual. "Projected" is the actual where one
 *    exists, else the estimate — so the total sharpens as contracts get signed.
 *  - Blank is not zero: a line with neither number contributes nothing and shows "—".
 *  - Outgoing payments are cash leaving for vendors. Incoming payments (Pro only) are
 *    the planner's own fee installments. The two are never netted together, because they
 *    belong to different businesses: the couple's wedding and the planner's company.
 */

export const lineProjected = (l: BudgetLine): number => l.actual ?? l.estimate ?? 0;

export interface BudgetSummary {
  estimate: number;
  actual: number;
  projected: number;
  target: number;
  /** target − projected. Negative = over budget. */
  remaining: number;
  overBudget: boolean;
}

export function budgetSummary(lines: BudgetLine[], target: number): BudgetSummary {
  let estimate = 0;
  let actual = 0;
  let projected = 0;
  for (const l of lines) {
    estimate += l.estimate ?? 0;
    actual += l.actual ?? 0;
    projected += lineProjected(l);
  }
  return {
    estimate,
    actual,
    projected,
    target,
    remaining: target - projected,
    overBudget: projected > target,
  };
}

export function budgetByCategory(lines: BudgetLine[]) {
  const map = new Map<string, { category: string; estimate: number; actual: number; projected: number; count: number }>();
  for (const l of lines) {
    const row = map.get(l.category) ?? { category: l.category, estimate: 0, actual: 0, projected: 0, count: 0 };
    row.estimate += l.estimate ?? 0;
    row.actual += l.actual ?? 0;
    row.projected += lineProjected(l);
    row.count++;
    map.set(l.category, row);
  }
  return [...map.values()].sort((a, b) => b.projected - a.projected);
}

export type PaymentState = "paid" | "overdue" | "due_soon" | "scheduled";

/** `today` is a YYYY-MM-DD string so comparisons are calendar-day, not clock-time. */
export function paymentState(p: Payment, today: string, soonDays = 14): PaymentState {
  if (p.paidDate) return "paid";
  if (p.dueDate < today) return "overdue";
  const soon = addDaysIso(today, soonDays);
  return p.dueDate <= soon ? "due_soon" : "scheduled";
}

export interface PaymentTotals {
  paid: number;
  outstanding: number;
  overdue: number;
  dueSoon: number;
  overdueCount: number;
  dueSoonCount: number;
}

export function paymentTotals(payments: Payment[], today: string): PaymentTotals {
  const t: PaymentTotals = { paid: 0, outstanding: 0, overdue: 0, dueSoon: 0, overdueCount: 0, dueSoonCount: 0 };
  for (const p of payments) {
    const s = paymentState(p, today);
    if (s === "paid") t.paid += p.amount;
    else {
      t.outstanding += p.amount;
      if (s === "overdue") {
        t.overdue += p.amount;
        t.overdueCount++;
      }
      if (s === "due_soon") {
        t.dueSoon += p.amount;
        t.dueSoonCount++;
      }
    }
  }
  return t;
}

/** What's contracted with a vendor vs. what's been paid against that booking. */
export function bookingBalance(b: Booking, payments: Payment[]) {
  const own = payments.filter((p) => p.bookingId === b.id);
  const scheduled = own.reduce((s, p) => s + p.amount, 0);
  const paid = own.filter((p) => p.paidDate).reduce((s, p) => s + p.amount, 0);
  return { contracted: b.amount ?? 0, scheduled, paid, balance: (b.amount ?? 0) - paid };
}

/** Standard gratuity guidance, as a % of the vendor's contract. A starting point, not a rule. */
export const SUGGESTED_TIP_PCT: Partial<Record<string, number>> = {
  catering: 0.15,
  beauty: 0.2,
  transportation: 0.15,
  music: 0.1,
  photography: 0.05,
  videography: 0.05,
};

/* ---------- guests ------------------------------------------------------------------- */

export interface GuestSummary {
  invited: number;
  attending: number;
  declined: number;
  pending: number;
  /** Seats needed: attending guests (children included — they take a seat). */
  seats: number;
  meals: Record<string, number>;
  dietary: number;
  seated: number;
}

export function guestSummary(guests: Guest[]): GuestSummary {
  const s: GuestSummary = { invited: guests.length, attending: 0, declined: 0, pending: 0, seats: 0, meals: {}, dietary: 0, seated: 0 };
  for (const g of guests) {
    if (g.rsvp === "attending") {
      s.attending++;
      s.seats++;
      if (g.meal) s.meals[g.meal] = (s.meals[g.meal] ?? 0) + 1;
      if (g.dietary) s.dietary++;
      if (g.table != null) s.seated++;
    } else if (g.rsvp === "declined") s.declined++;
    else s.pending++;
  }
  return s;
}

/** Cost per attending guest — the number couples actually ask about. */
export const costPerGuest = (projected: number, attending: number) =>
  attending > 0 ? projected / attending : null;

/* ---------- dates -------------------------------------------------------------------- */

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysIso(isoDay: string, n: number): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split("-").map(Number);
  const [y2, m2, d2] = toIso.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}
