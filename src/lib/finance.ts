import type { BudgetLine, Booking, FeeTerms, Guest, Payment } from "~/data/types";

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

/**
 * Standard gratuity guidance. A starting point, not a rule.
 * Percents apply to the vendor's contract; the officiant figure is a flat envelope
 * (or a church donation of about that size).
 */
export const SUGGESTED_TIP_PCT: Partial<Record<string, number>> = {
  catering: 0.15,
  beauty: 0.2,
  transportation: 0.15,
  music: 0.1,
  photography: 0.05,
  videography: 0.05,
};

export const SUGGESTED_TIP_FLAT: Partial<Record<string, number>> = {
  officiant: 100,
};

/** Suggested envelope for one contract, rounded to $5. Null when there's no guidance or no contract. */
export function suggestedTip(amount: number | null, category: string): number | null {
  if (amount == null || amount <= 0) return null;
  const pct = SUGGESTED_TIP_PCT[category];
  if (pct != null) return Math.round((amount * pct) / 5) * 5;
  return SUGGESTED_TIP_FLAT[category] ?? null;
}

/** Sum of known amounts. Every value blank returns null — blank is not zero. */
export function sumKnown(values: readonly (number | null | undefined)[]): number | null {
  let total = 0;
  let any = false;
  for (const v of values) {
    if (v == null) continue;
    any = true;
    total += v;
  }
  return any ? total : null;
}

/* ---------- planner fee (Pro) -------------------------------------------------------- */

/**
 * The planner's fee for one wedding.
 *
 * Percent and the percent half of a hybrid are taken from the couple's budget target —
 * the number the quote was made against — not from vendor lines, so the fee does not
 * include itself. A blank input stays blank: a percent with no budget, a hybrid missing
 * either half, or an hourly quote missing hours or rate all return null. Zero is a real
 * amount and is returned as 0. The result is whole dollars, matching how money is shown.
 */
export function plannerFee(terms: FeeTerms, budgetTarget: number | null): number | null {
  switch (terms.feeModel) {
    case "flat":
      return terms.feeFlat;
    case "percent":
      if (terms.feePercent == null || budgetTarget == null) return null;
      return Math.round((budgetTarget * terms.feePercent) / 100);
    case "hybrid":
      if (terms.feeFlat == null || terms.feePercent == null || budgetTarget == null) return null;
      return Math.round(terms.feeFlat + (budgetTarget * terms.feePercent) / 100);
    case "hourly":
      if (terms.feeHours == null || terms.feeRate == null) return null;
      return Math.round(terms.feeHours * terms.feeRate);
  }
}

/**
 * Split `total` by `shares`. The last part absorbs rounding so the parts add up to
 * `total` exactly — an installment schedule must not drift off the fee.
 */
export function splitAmount(total: number, shares: readonly number[]): number[] {
  if (shares.length === 0) return [];
  const out: number[] = [];
  let used = 0;
  for (let i = 0; i < shares.length; i++) {
    if (i === shares.length - 1) out.push(total - used);
    else {
      const part = Math.round(total * shares[i]);
      out.push(part);
      used += part;
    }
  }
  return out;
}

export interface FeeInstallment {
  label: string;
  amount: number;
  dueDate: string;
}

/**
 * Retainer at signing, midpoint six months out, final 30 days out
 * (research §1.8: 40% / 30% / 30%). Dates that have already passed collapse
 * into fewer payments so a short engagement is not born overdue.
 * Amounts sum to `fee`.
 */
export function plannerInstallments(fee: number, weddingDate: string, today: string): FeeInstallment[] {
  const finalDue = addDaysIso(weddingDate, -30);
  const midDue = addDaysIso(weddingDate, -180);
  if (finalDue <= today) return [{ label: "Planning fee", amount: fee, dueDate: today }];
  const shares = midDue <= today ? [0.5, 0.5] : [0.4, 0.3, 0.3];
  const amounts = splitAmount(fee, shares);
  const labels = midDue <= today
    ? ["Retainer", "Final installment"]
    : ["Retainer", "Midpoint installment", "Final installment"];
  const dates = midDue <= today ? [today, finalDue] : [today, midDue, finalDue];
  return labels.map((label, i) => ({ label, amount: amounts[i] ?? 0, dueDate: dates[i] ?? today }));
}

/**
 * New amounts for unpaid incoming installments so they, plus what's already paid,
 * add up to `fee`. Returns nothing when the fee is blank, nothing is unpaid, or
 * the paid total is already past the fee (paid rows are never rewritten).
 * Shares follow the unpaid rows' current amounts; even split when those are all zero.
 */
export function rescaleUnpaidInstallments<T extends { id: string; amount: number; paidDate: string | null }>(
  fee: number | null,
  payments: readonly T[],
): { id: string; amount: number }[] {
  if (fee == null) return [];
  const unpaid = payments.filter((p) => p.paidDate == null);
  if (unpaid.length === 0) return [];
  const paid = payments.filter((p) => p.paidDate != null).reduce((s, p) => s + p.amount, 0);
  const remaining = fee - paid;
  if (remaining < 0) return [];
  const current = unpaid.map((p) => p.amount);
  const sum = current.reduce((s, n) => s + n, 0);
  const shares = sum > 0 ? current.map((n) => n / sum) : unpaid.map(() => 1 / unpaid.length);
  const next = splitAmount(remaining, shares);
  return unpaid.flatMap((p, i) => {
    const amount = next[i];
    return amount != null && amount !== p.amount ? [{ id: p.id, amount }] : [];
  });
}

/**
 * The single Planning line is the fee on the couple's budget. Update its estimate
 * when the fee is a real number. A blank fee does not wipe a line the couple typed.
 * More than one Planning line is left alone.
 */
export function planningEstimateUpdate(
  lines: readonly BudgetLine[],
  fee: number | null,
): { id: string; estimate: number } | null {
  if (fee == null) return null;
  const planning = lines.filter((l) => l.category === "Planning");
  if (planning.length !== 1) return null;
  const line = planning[0];
  if (line.estimate === fee) return null;
  return { id: line.id, estimate: fee };
}

/**
 * Estimate − projected: positive = under the estimate, negative = over. Lines without an
 * actual have no variance yet (projected falls back to the estimate).
 */
export const lineVariance = (l: BudgetLine): number | null =>
  l.actual == null ? null : (l.estimate ?? 0) - lineProjected(l);

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
