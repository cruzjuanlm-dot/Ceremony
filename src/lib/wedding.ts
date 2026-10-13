import type {
  AppointmentKind,
  BookingStage,
  CeremonyType,
  ClientStatus,
  DocumentKind,
  DocumentStatus,
  MealChoice,
  QuoteItemKey,
  QuoteItemState,
  QuoteLineKind,
  ServiceLevel,
  TimelineSegment,
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

export const MEAL_LABEL: Record<MealChoice, string> = {
  beef: "Beef",
  fish: "Fish",
  chicken: "Chicken",
  vegetarian: "Vegetarian",
  kids: "Kids",
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

export const QUOTE_ITEM_LABEL: Record<QuoteItemKey, string> = {
  ceremony_site: "Ceremony site",
  catering: "Food & catering",
  bar: "Bar & drinks",
  staff: "Servers & bartenders",
  tables_chairs: "Tables & chairs",
  linens: "Linens",
  tableware: "Plates, glassware & flatware",
  cake_cutting: "Cake cutting",
  coordinator: "Venue coordinator",
  setup_cleanup: "Setup & cleanup",
  security: "Security",
  parking: "Parking or valet",
  lighting: "Lighting",
  sound: "Sound system & mics",
  getting_ready: "Getting-ready suite",
  rain_plan: "Rain plan / tent",
  insurance: "Event insurance",
};

export const QUOTE_ITEM_STATE_LABEL: Record<QuoteItemState, string> = {
  included: "Included",
  not_included: "Not included",
  unknown: "Not asked",
};

export const QUOTE_LINE_KIND_LABEL: Record<QuoteLineKind, string> = {
  rental: "Venue rental",
  food_bev: "Food & drink",
  fee: "Fee",
};
