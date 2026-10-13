import type { BudgetCategory, VendorCategory } from "~/data/types";

/**
 * Non-component helpers for the wedding page. Kept out of the .tsx files so those export
 * only components (React Fast Refresh). Money math (lineVariance, suggestedTips) lives in
 * lib/finance.ts, not here.
 */

export const WEDDING_TABS = [
  "overview",
  "budget",
  "guests",
  "timeline",
  "vendors",
  "quotes",
  "checklist",
  "logistics",
  "documents",
] as const;
export type WeddingTab = (typeof WEDDING_TABS)[number];

/** Checklist phases, earliest first. Unknown phases sort after these, in first-seen order. */
export const PHASE_ORDER = [
  "12+ months",
  "9–12 months",
  "6–9 months",
  "4–6 months",
  "2–4 months",
  "1–2 months",
  "Final weeks",
  "Week of",
];

/** The budget grid's category order (matches the seeded split). */
export const BUDGET_CATEGORIES: BudgetCategory[] = [
  "Venue & catering",
  "Photo & video",
  "Florals & decor",
  "Music & entertainment",
  "Attire & beauty",
  "Ceremony",
  "Stationery",
  "Rentals & lighting",
  "Cake & desserts",
  "Transportation",
  "Guest experience",
  "Planning",
  "Rings",
  "Gratuities",
  "Other",
];

/** Which budget category a booked vendor's cost lands in. */
export const VENDOR_BUDGET_CATEGORY: Record<VendorCategory, BudgetCategory> = {
  venue: "Venue & catering",
  catering: "Venue & catering",
  photography: "Photo & video",
  videography: "Photo & video",
  florals: "Florals & decor",
  music: "Music & entertainment",
  officiant: "Ceremony",
  beauty: "Attire & beauty",
  attire: "Attire & beauty",
  cake: "Cake & desserts",
  rentals: "Rentals & lighting",
  lighting: "Rentals & lighting",
  stationery: "Stationery",
  transportation: "Transportation",
  accommodation: "Guest experience",
  planning: "Planning",
  other: "Other",
};

/** "$1,250.50" / "1250" / "" → number | null. Blank is not zero. */
export function parseAmount(s: string): number | null {
  const cleaned = s.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
