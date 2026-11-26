import type {
  AppointmentKind,
  BookingStage,
  BudgetLine,
  CeremonyType,
  ClientStatus,
  DocumentKind,
  DocumentStatus,
  FeeModel,
  MealChoice,
  ServiceLevel,
  SubEventKind,
  TimelineSegment,
  TipHandover,
  VendorCategory,
  Wedding,
} from "~/data/types";

import { daysBetween, todayIso } from "./finance";

/**
 * Derived lifecycle — where a wedding IS, computed from its date (Libretto's
 * eventLifecycle() pattern). Any "what should this screen lead with" question reads this,
 * never a stored status.
 */
export type WeddingPhase = "undated" | "planning" | "final_details" | "wedding_week" | "today" | "married";

export function weddingPhase(w: Pick<Wedding, "date">, today = todayIso()): WeddingPhase {
  if (!w.date) return "undated";
  const d = daysBetween(today, w.date);
  if (d < 0) return "married";
  if (d === 0) return "today";
  if (d <= 7) return "wedding_week";
  if (d <= 60) return "final_details";
  return "planning";
}

export const PHASE_LABEL: Record<WeddingPhase, string> = {
  undated: "No date yet",
  planning: "Planning",
  final_details: "Final details",
  wedding_week: "Wedding week",
  today: "Today",
  married: "Married",
};

export function daysUntil(w: Pick<Wedding, "date">, today = todayIso()): number | null {
  return w.date ? daysBetween(today, w.date) : null;
}

export function countdownLabel(days: number | null): string {
  if (days == null) return "Date TBD";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${-days} days ago`;
  if (days < 60) return `${days} days`;
  const months = Math.round(days / 30.4);
  return `${months} months`;
}

/* ---------- labels — one vocabulary, used everywhere --------------------------------- */

export const VENDOR_CATEGORY_LABEL: Record<VendorCategory, string> = {
  venue: "Venue",
  catering: "Catering",
  photography: "Photography",
  videography: "Videography",
  florals: "Florals",
  music: "Music",
  officiant: "Officiant",
  beauty: "Hair & makeup",
  attire: "Attire",
  cake: "Cake",
  rentals: "Rentals",
  lighting: "Lighting",
  stationery: "Stationery",
  transportation: "Transportation",
  accommodation: "Accommodation",
  planning: "Planning",
  other: "Other",
};

export const STAGE_LABEL: Record<BookingStage, string> = {
  researching: "Researching",
  contacted: "Contacted",
  quoted: "Quoted",
  booked: "Booked",
  declined: "Declined",
};
export const STAGES: BookingStage[] = ["researching", "contacted", "quoted", "booked", "declined"];

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  inquiry: "Inquiry",
  proposal: "Proposal sent",
  booked: "Booked",
  completed: "Completed",
  lost: "Lost",
};

export const SERVICE_LEVEL_LABEL: Record<ServiceLevel, string> = {
  full: "Full planning",
  partial: "Partial planning",
  day_of: "Day-of coordination",
};

export const FEE_MODEL_LABEL: Record<FeeModel, string> = {
  flat: "Flat",
  percent: "Percent of budget",
  hybrid: "Hybrid",
  hourly: "Hourly",
};

/** City string → PR or FL, the two jurisdictions the research covers. */
export type Jurisdiction = "PR" | "FL";

export function jurisdictionOf(city: string): Jurisdiction | null {
  if (/\bPR\b|puerto rico/i.test(city)) return "PR";
  if (/\bFL\b|florida/i.test(city)) return "FL";
  return null;
}

export const CEREMONY_LABEL: Record<CeremonyType, string> = {
  catholic: "Catholic",
  civil: "Civil",
  christian: "Christian",
  jewish: "Jewish",
  interfaith: "Interfaith",
  symbolic: "Symbolic",
};

export const SEGMENT_LABEL: Record<TimelineSegment, string> = {
  getting_ready: "Getting ready",
  photos: "Photos",
  ceremony: "Ceremony",
  cocktail: "Cocktail hour",
  reception: "Reception",
  after: "Send-off",
};

/** Weekend order, welcome through brunch. */
export const SUB_EVENT_ORDER: readonly SubEventKind[] = [
  "welcome",
  "rehearsal",
  "ceremony",
  "cocktail",
  "reception",
  "after_party",
  "brunch",
];

export const SUB_EVENT_LABEL: Record<SubEventKind, string> = {
  welcome: "Welcome party",
  rehearsal: "Rehearsal",
  ceremony: "Ceremony",
  cocktail: "Cocktail hour",
  reception: "Reception",
  after_party: "After-party",
  brunch: "Brunch",
};

const RECEPTION_BUDGET = new Set(["Venue rental", "Catering & bar", "Wedding cake", "DJ / band"]);

/** A budget line belongs to one part of the weekend only when the description already says so. */
export function subEventKindForBudgetLine(line: Pick<BudgetLine, "category" | "description">): SubEventKind | null {
  if (line.category === "Ceremony") return "ceremony";
  if (RECEPTION_BUDGET.has(line.description)) return "reception";
  return null;
}

/** Vendors whose work is one part of the day. Everyone else stays on the whole wedding. */
export function subEventKindForVendor(category: VendorCategory): SubEventKind | null {
  if (category === "officiant") return "ceremony";
  if (category === "venue" || category === "catering" || category === "music" || category === "cake") return "reception";
  return null;
}

/** Timeline segments that are themselves a sub-event. Getting ready and photos are not. */
export function subEventKindForSegment(segment: TimelineSegment): SubEventKind | null {
  if (segment === "ceremony") return "ceremony";
  if (segment === "cocktail") return "cocktail";
  if (segment === "reception") return "reception";
  if (segment === "after") return "after_party";
  return null;
}

/** First event of that kind. A line never points at two. */
export function subEventIdForKind(
  kind: SubEventKind | null,
  events: readonly { id: string; kind: SubEventKind }[],
): string | null {
  if (!kind) return null;
  return events.find((e) => e.kind === kind)?.id ?? null;
}

export const MEAL_LABEL: Record<MealChoice, string> = {
  beef: "Beef",
  fish: "Fish",
  chicken: "Chicken",
  vegetarian: "Vegetarian",
  kids: "Kids",
};

export const TIP_HANDOVER_LABEL: Record<TipHandover, string> = {
  planner: "Planner",
  couple: "Couple",
  family: "Family",
};

export const APPOINTMENT_LABEL: Record<AppointmentKind, string> = {
  consultation: "Consultation",
  venue_visit: "Venue visit",
  tasting: "Tasting",
  fitting: "Fitting",
  meeting: "Meeting",
  rehearsal: "Rehearsal",
  call: "Call",
};

export const DOC_KIND_LABEL: Record<DocumentKind, string> = {
  contract: "Contract",
  proposal: "Proposal",
  invoice: "Invoice",
  insurance: "Insurance",
  license: "Marriage license",
  floor_plan: "Floor plan",
  other: "Other",
};

export const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  signed: "Signed",
  paid: "Paid",
  expired: "Expired",
  filed: "Filed",
};
