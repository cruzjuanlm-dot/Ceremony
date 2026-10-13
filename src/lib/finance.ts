import type {
  BudgetLine,
  Booking,
  Guest,
  Payment,
  QuoteItemKey,
  QuoteItemState,
  QuoteLine,
  Vendor,
  VenueNeeds,
  VenueQuote,
  Wedding,
} from "~/data/types";

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

/**
 * Estimate − projected: positive = under the estimate, negative = over. Lines without an
 * actual have no variance yet (projected falls back to the estimate).
 */
export const lineVariance = (l: BudgetLine): number | null =>
  l.actual == null ? null : (l.estimate ?? 0) - lineProjected(l);

/** Suggested gratuity per booked vendor (SUGGESTED_TIP_PCT), rounded to $5. */
export function suggestedTips(bookings: Booking[], vendors: Vendor[]) {
  const rows: { booking: Booking; vendor: Vendor; pct: number; tip: number }[] = [];
  for (const b of bookings) {
    if (b.stage !== "booked" || !b.amount) continue;
    const vendor = vendors.find((v) => v.id === b.vendorId);
    const pct = vendor ? SUGGESTED_TIP_PCT[vendor.category] : undefined;
    if (!vendor || !pct) continue;
    rows.push({ booking: b, vendor, pct, tip: Math.round((b.amount * pct) / 5) * 5 });
  }
  const total = rows.reduce((s, r) => s + r.tip, 0);
  return { rows, total };
}

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

/* ---------- venue quotes ------------------------------------------------------------- */

/**
 * Venues quote different bundles: one is "venue only", another is an all-in package
 * with a food & beverage minimum, a 22% service charge and tax on top. The sticker
 * price compares nothing. The REAL price of a quote is:
 *
 *   quoted lines (per-guest lines × guests)
 *   + F&B minimum top-up (if F&B spend falls short of the minimum)
 *   + service charge (on F&B and the top-up)
 *   + tax (on everything, service charge included when the venue taxes it)
 *   + overtime (hours the day needs beyond what's included)
 *   + what you'd still pay elsewhere for each needed thing the quote doesn't cover
 *
 * "Unknown" items (not asked yet) are priced as missing, so a vague quote can't win by
 * staying vague, and they're listed as questions for the venue.
 */

export type QuoteItemBasis = "per_guest" | "flat";

/**
 * What it costs to cover each item OUTSIDE the venue. Rough mid-market starting points
 * (PR / South Florida, 2026), editable per wedding in "What we need".
 */
export const QUOTE_ITEM_DEFAULTS: Record<QuoteItemKey, { basis: QuoteItemBasis; estimate: number }> = {
  ceremony_site: { basis: "flat", estimate: 2000 },
  catering: { basis: "per_guest", estimate: 85 },
  bar: { basis: "per_guest", estimate: 35 },
  staff: { basis: "per_guest", estimate: 15 },
  tables_chairs: { basis: "per_guest", estimate: 12 },
  linens: { basis: "per_guest", estimate: 6 },
  tableware: { basis: "per_guest", estimate: 8 },
  cake_cutting: { basis: "per_guest", estimate: 3 },
  coordinator: { basis: "flat", estimate: 1200 },
  setup_cleanup: { basis: "flat", estimate: 800 },
  security: { basis: "flat", estimate: 400 },
  parking: { basis: "flat", estimate: 1200 },
  lighting: { basis: "flat", estimate: 1000 },
  sound: { basis: "flat", estimate: 500 },
  getting_ready: { basis: "flat", estimate: 500 },
  rain_plan: { basis: "flat", estimate: 3000 },
  insurance: { basis: "flat", estimate: 250 },
};

export const QUOTE_ITEM_KEYS = Object.keys(QUOTE_ITEM_DEFAULTS) as QuoteItemKey[];

export const DEFAULT_VENUE_HOURS = 6;

export interface ResolvedNeed {
  key: QuoteItemKey;
  needed: boolean;
  basis: QuoteItemBasis;
  /** Per guest or flat, as `basis` says. */
  estimate: number | null;
  /** The estimate at the comparison's guest count. Null when no estimate is set. */
  total: number | null;
}

/** The wedding's needs with defaults filled in. A church ceremony doesn't need a ceremony site. */
export function resolveVenueNeeds(
  w: Pick<Wedding, "venueNeeds" | "ceremonyType">,
  guests: number,
): { hoursNeeded: number | null; items: ResolvedNeed[] } {
  const own = w.venueNeeds;
  const items = QUOTE_ITEM_KEYS.map((key): ResolvedNeed => {
    const def = QUOTE_ITEM_DEFAULTS[key];
    const o = own?.items[key];
    const needed = o?.needed ?? !(key === "ceremony_site" && w.ceremonyType === "catholic");
    const estimate = o && "estimate" in o ? (o.estimate ?? null) : def.estimate;
    const total = estimate == null ? null : def.basis === "per_guest" ? estimate * guests : estimate;
    return { key, needed, basis: def.basis, estimate, total };
  });
  return { hoursNeeded: own ? own.hoursNeeded : DEFAULT_VENUE_HOURS, items };
}

export const quoteLineTotal = (l: QuoteLine, guests: number): number | null =>
  l.amount == null ? null : l.perGuest ? l.amount * guests : l.amount;

export interface QuoteGap {
  key: QuoteItemKey;
  state: QuoteItemState;
  /** What covering it elsewhere costs. 0 when included; null when no estimate exists. */
  cost: number | null;
}

/** Something to ask the venue before the number can be trusted. */
export type QuoteQuestion =
  | { kind: "item"; key: QuoteItemKey }
  | { kind: "line_amount"; label: string }
  | { kind: "service_charge" }
  | { kind: "tax" }
  | { kind: "hours" }
  | { kind: "overtime_rate" };

export interface QuoteCost {
  /** Sum of the quote's lines at the comparison guest count — the sticker price. */
  subtotal: number;
  fbSpend: number;
  minimumTopUp: number;
  serviceCharge: number;
  tax: number;
  /** What the venue will invoice: subtotal + top-up + service + tax. */
  quoted: number;
  overtimeHours: number;
  overtime: number;
  gaps: QuoteGap[];
  /** Cost of needed items the quote doesn't cover (unknowns included). */
  extras: number;
  /** The part of `extras` that's only there because nobody has asked yet. */
  unknownExtras: number;
  /** quoted + overtime + extras — the number to compare. */
  real: number;
  perGuest: number | null;
  questions: QuoteQuestion[];
  /** False until the quote has at least one priced line. */
  priced: boolean;
}

const pctOf = (base: number, p: number | null) => (p == null ? 0 : (base * p) / 100);

export function quoteCost(
  q: VenueQuote,
  guests: number,
  needs: { hoursNeeded: number | null; items: ResolvedNeed[] },
): QuoteCost {
  const questions: QuoteQuestion[] = [];
  let subtotal = 0;
  let fbSpend = 0;
  let pricedLines = 0;
  for (const l of q.lines) {
    const t = quoteLineTotal(l, guests);
    if (t == null) {
      questions.push({ kind: "line_amount", label: l.label || "Unnamed line" });
      continue;
    }
    pricedLines++;
    subtotal += t;
    if (l.kind === "food_bev") fbSpend += t;
  }

  const minimumTopUp = q.fbMinimum != null ? Math.max(0, q.fbMinimum - fbSpend) : 0;
  const serviceBase = fbSpend + minimumTopUp;
  if (serviceBase > 0 && q.serviceChargePct == null) questions.push({ kind: "service_charge" });
  const serviceCharge = pctOf(serviceBase, q.serviceChargePct);
  if (subtotal > 0 && q.taxPct == null) questions.push({ kind: "tax" });
  const tax = pctOf(subtotal + minimumTopUp + (q.taxOnServiceCharge ? serviceCharge : 0), q.taxPct);
  const quoted = subtotal + minimumTopUp + serviceCharge + tax;

  let overtimeHours = 0;
  let overtime = 0;
  if (needs.hoursNeeded != null) {
    if (q.hoursIncluded == null) questions.push({ kind: "hours" });
    else {
      overtimeHours = Math.max(0, needs.hoursNeeded - q.hoursIncluded);
      if (overtimeHours > 0) {
        if (q.overtimePerHour == null) questions.push({ kind: "overtime_rate" });
        else overtime = overtimeHours * q.overtimePerHour;
      }
    }
  }

  const gaps: QuoteGap[] = [];
  let extras = 0;
  let unknownExtras = 0;
  for (const n of needs.items) {
    if (!n.needed) continue;
    const state = q.items[n.key] ?? "unknown";
    if (state === "included") {
      gaps.push({ key: n.key, state, cost: 0 });
      continue;
    }
    const cost = q.gapOverrides[n.key] ?? n.total;
    gaps.push({ key: n.key, state, cost });
    extras += cost ?? 0;
    if (state === "unknown") {
      unknownExtras += cost ?? 0;
      questions.push({ kind: "item", key: n.key });
    }
  }

  const real = quoted + overtime + extras;
  return {
    subtotal,
    fbSpend,
    minimumTopUp,
    serviceCharge,
    tax,
    quoted,
    overtimeHours,
    overtime,
    gaps,
    extras,
    unknownExtras,
    real,
    perGuest: guests > 0 ? real / guests : null,
    questions,
    priced: pricedLines > 0,
  };
}

export interface RankedQuote {
  quote: VenueQuote;
  cost: QuoteCost;
  /** 1 = best real price. Null for unpriced quotes, which can't be ranked. */
  rank: number | null;
  /** real − best real. 0 for the best; null when unranked. */
  vsBest: number | null;
}

/** Every quote costed and ranked by real price, cheapest first; unpriced quotes last. */
export function rankQuotes(
  quotes: VenueQuote[],
  guests: number,
  needs: { hoursNeeded: number | null; items: ResolvedNeed[] },
): RankedQuote[] {
  const costed = quotes.map((quote) => ({ quote, cost: quoteCost(quote, guests, needs) }));
  const priced = costed.filter((c) => c.cost.priced).sort((a, b) => a.cost.real - b.cost.real);
  const best = priced[0]?.cost.real ?? null;
  return [
    ...priced.map((c, i) => ({ ...c, rank: i + 1, vsBest: best == null ? null : c.cost.real - best })),
    ...costed.filter((c) => !c.cost.priced).map((c) => ({ ...c, rank: null, vsBest: null })),
  ];
}

/** The quote with the lowest sticker price (lines only), when it isn't also the best real price. */
export function stickerTrap(ranked: RankedQuote[]): { trap: RankedQuote; best: RankedQuote } | null {
  const priced = ranked.filter((r) => r.rank != null);
  if (priced.length < 2) return null;
  const cheapestSticker = priced.reduce((a, b) => (b.cost.subtotal < a.cost.subtotal ? b : a));
  return cheapestSticker.rank === 1 ? null : { trap: cheapestSticker, best: priced[0] };
}

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
