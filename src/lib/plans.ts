import type { Plan as Audience } from "~/data/types";

/**
 * Ceremony's plans — same shape and spirit as Libretto's `src/lib/plans.ts`, numbers from
 * ceremony/docs/WEDDING_INDUSTRY_RESEARCH.md §3 (recommendations for validation, not tested
 * prices).
 *
 *   DIY Free        $0           budget + checklist, up to 50 guests
 *   DIY Complete    $79 once     everything for one wedding, 24 months of access
 *   Pro Solo        $59/mo       ($49/mo billed annually) 1 seat, 15 active weddings
 *   Pro Studio      $99/mo       ($79/mo billed annually) 3 seats, unlimited weddings
 *   Extra seat      $15/mo       client-portal and day-of crew seats are always free
 *
 * As in Libretto, the eventual source of truth for PRICES is Stripe, resolved by
 * `priceLookupKey`; the dollar figures here are display values for the demo. Note that DIY
 * Complete is a ONE-TIME payment — Libretto's billing flow is subscription-only
 * (Checkout in `mode: "subscription"`), so selling it needs a `mode: "payment"` Checkout and
 * an access-until date instead of a subscription status. That is a billing change, not data.
 */

export type PlanKey = "diy_free" | "diy_complete" | "pro_solo" | "pro_studio";
export type BillingInterval = "free" | "one_time" | "month";

export interface CeremonyPlan {
  key: PlanKey;
  name: string;
  audience: Audience;
  /** Display price, e.g. "$59". */
  price: string;
  /** Annual-billing equivalent per month, when offered. */
  annualPrice: string | null;
  interval: BillingInterval;
  /** How long a one-time purchase lasts. */
  accessMonths: number | null;
  priceLookupKey: string | null;
  /** null = unlimited. */
  limits: { activeWeddings: number | null; seats: number | null; guests: number | null };
  features: string[];
}

export const EXTRA_SEAT_PRICE = "$15";

export const PLANS: Record<PlanKey, CeremonyPlan> = {
  diy_free: {
    key: "diy_free",
    name: "DIY Free",
    audience: "diy",
    price: "$0",
    annualPrice: null,
    interval: "free",
    accessMonths: null,
    priceLookupKey: null,
    limits: { activeWeddings: 1, seats: 2, guests: 50 },
    features: ["Budget", "Checklist", "Up to 50 guests"],
  },
  diy_complete: {
    key: "diy_complete",
    name: "DIY Complete",
    audience: "diy",
    price: "$79",
    annualPrice: null,
    interval: "one_time",
    accessMonths: 24,
    priceLookupKey: "ceremony_diy_onetime",
    limits: { activeWeddings: 1, seats: 2, guests: null },
    features: ["Everything for one wedding", "Unlimited guests", "Vendors & payments", "Day-of timeline", "24 months of access"],
  },
  pro_solo: {
    key: "pro_solo",
    name: "Pro Solo",
    audience: "pro",
    price: "$59",
    annualPrice: "$49",
    interval: "month",
    accessMonths: null,
    priceLookupKey: "ceremony_pro_solo_monthly",
    limits: { activeWeddings: 15, seats: 1, guests: null },
    features: ["1 planner seat", "15 active weddings", "Clients & fee installments", "Free client portal & crew seats"],
  },
  pro_studio: {
    key: "pro_studio",
    name: "Pro Studio",
    audience: "pro",
    price: "$99",
    annualPrice: "$79",
    interval: "month",
    accessMonths: null,
    priceLookupKey: "ceremony_pro_studio_monthly",
    limits: { activeWeddings: null, seats: 3, guests: null },
    features: ["3 planner seats", "Unlimited weddings", `Extra seats ${EXTRA_SEAT_PRICE}/mo`, "Free client portal & crew seats"],
  },
};

/** Display order, couples first then planners, cheapest first within each. */
export const PLAN_ORDER: PlanKey[] = ["diy_free", "diy_complete", "pro_solo", "pro_studio"];

/** The plan each demo workspace runs on. */
export const DEMO_PLAN: Record<Audience, { key: PlanKey; status: string }> = {
  pro: { key: "pro_solo", status: "trial" },
  diy: { key: "diy_complete", status: "" },
};

export function priceLabel(p: CeremonyPlan): string {
  if (p.interval === "free") return "Free";
  if (p.interval === "one_time") return `${p.price} once`;
  return `${p.price}/mo`;
}
