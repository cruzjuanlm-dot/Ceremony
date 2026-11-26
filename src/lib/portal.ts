import {
  PORTAL_MODULES,
  type Booking,
  type BudgetLine,
  type Client,
  type DocumentKind,
  type DocumentRecord,
  type Email,
  type Guest,
  type MealChoice,
  type Payment,
  type Plan,
  type PortalModule,
  type PortalShare,
  type RsvpStatus,
  type Task,
  type TimelineItem,
  type Vendor,
  type Wedding,
} from "~/data/types";

import {
  budgetByCategory,
  budgetSummary,
  guestSummary,
  paymentState,
  paymentTotals,
  todayIso,
  type GuestSummary,
  type PaymentState,
  type PaymentTotals,
} from "./finance";
import { CEREMONY_LABEL, DOC_KIND_LABEL, SEGMENT_LABEL, VENDOR_CATEGORY_LABEL, countdownLabel, daysUntil, weddingPhase, type WeddingPhase } from "./wedding";

/**
 * The couple view is a second reading of the same rows, not a copy of the plan.
 * This function is the boundary: anything it does not put on the result cannot
 * show up on the couple's screen. Internal notes, other weddings, and the
 * planner's email log stay on the input side.
 */

export const PORTAL_MODULE_LABEL: Record<PortalModule, string> = {
  timeline: "Timeline",
  tasks: "Tasks",
  files: "Files",
  budget: "Budget",
  payments: "Payments",
  vendors: "Vendors",
  guests: "Guests",
};

/** Insurance certificates are the planner's vendor paperwork, not the couple's plan. */
const HIDDEN_FILE_KINDS = new Set<DocumentKind>(["insurance"]);

export function defaultPortalShare(weddingId: string, plan: Plan): PortalShare {
  return {
    id: `por_${weddingId}`,
    weddingId,
    token: `demo-${plan}-${weddingId}`,
    enabled: true,
    visible: [...PORTAL_MODULES],
  };
}

export function normalizePortalShare(share: PortalShare, plan: Plan): PortalShare {
  const visible = PORTAL_MODULES.filter((m) => Array.isArray(share.visible) && share.visible.includes(m));
  const token = share.token?.trim() || defaultPortalShare(share.weddingId, plan).token;
  return {
    id: share.id || `por_${share.weddingId}`,
    weddingId: share.weddingId,
    token,
    enabled: share.enabled !== false,
    visible,
  };
}

/**
 * A missing row means "show the default view". A stored row wins, including one
 * the planner has turned off. Tokens only match the plan that is open in this browser.
 */
export function resolvePortalShare(
  shares: PortalShare[],
  weddings: Wedding[],
  token: string,
  plan: Plan,
): PortalShare | null {
  const stored = shares.find((s) => s.token === token);
  if (stored) {
    return weddings.some((w) => w.id === stored.weddingId) ? normalizePortalShare(stored, plan) : null;
  }
  const wedding = weddings.find((w) => defaultPortalShare(w.id, plan).token === token);
  return wedding ? defaultPortalShare(wedding.id, plan) : null;
}

export interface PortalSource {
  share: PortalShare;
  wedding: Wedding;
  workspaceName: string;
  vendors: Vendor[];
  bookings: Booking[];
  timeline: TimelineItem[];
  tasks: Task[];
  documents: DocumentRecord[];
  budgetLines: BudgetLine[];
  payments: Payment[];
  guests: Guest[];
  /** Passed so a test can pin "today". The screen uses the real day. */
  today?: string;
  /** Accepted and ignored. Present so a test can prove notes never cross the boundary. */
  clients?: Client[];
  emails?: Email[];
}

export interface PortalTaskRow {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  phase: string;
  overdue: boolean;
}

export interface PortalTimelineRow {
  id: string;
  time: string;
  title: string;
  segment: string;
  location: string;
  owner: string;
  durationMin: number;
}

export interface PortalFileRow {
  id: string;
  title: string;
  kind: string;
  status: DocumentRecord["status"];
  amount: number | null;
  url: string | null;
}

export interface PortalVendorRow {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  arrival: string | null;
}

export interface PortalGuestRow {
  id: string;
  name: string;
  household: string;
  rsvp: RsvpStatus;
  meal: MealChoice | null;
  dietary: string;
  role: string;
  table: number | null;
  isChild: boolean;
  isPlusOne: boolean;
}

export interface PortalPaymentRow {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  state: PaymentState;
}

export interface PortalPaymentSide {
  rows: PortalPaymentRow[];
  totals: PaymentTotals;
}

export interface PortalBudget {
  target: number;
  /** Null when the wedding has no lines yet. Zero would mean a real $0 plan. */
  projected: number | null;
  remaining: number | null;
  overBudget: boolean;
  categories: { category: string; projected: number }[];
}

export interface OpenPortal {
  closed: false;
  brand: string;
  title: string;
  date: string | null;
  ceremonyTime: string | null;
  city: string;
  ceremony: string;
  style: string;
  venueName: string | null;
  venueAddress: string | null;
  rainPlan: string;
  guestEstimate: number;
  countdown: string;
  phase: WeddingPhase;
  tasks?: PortalTaskRow[];
  timeline?: PortalTimelineRow[];
  files?: PortalFileRow[];
  budget?: PortalBudget;
  payments?: { outgoing: PortalPaymentSide; incoming: PortalPaymentSide };
  vendors?: PortalVendorRow[];
  guests?: { summary: GuestSummary; rows: PortalGuestRow[] };
}

export interface ClosedPortal {
  closed: true;
  reason: "off";
}

export type CouplePortal = OpenPortal | ClosedPortal;

function shows(share: PortalShare, module: PortalModule) {
  return share.visible.includes(module);
}

export function projectCouplePortal(source: PortalSource): CouplePortal {
  // Touch the ignored bags so a refactor that drops them is a type error,
  // without ever copying their fields onto the result.
  void source.clients;
  void source.emails;

  if (!source.share.enabled) return { closed: true, reason: "off" };

  const today = source.today ?? todayIso();
  const wedding = source.wedding;
  const own = <T extends { weddingId: string | null }>(rows: T[]) => rows.filter((r) => r.weddingId === wedding.id);

  const venue = source.vendors.find((v) => v.id === wedding.venueId) ?? null;
  const share = source.share;

  const tasks = shows(share, "tasks")
    ? own(source.tasks)
        .filter((t) => t.owner === "couple")
        .map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          done: t.done,
          phase: t.phase,
          overdue: !t.done && !!t.dueDate && t.dueDate < today,
        }))
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return 0;
        })
    : undefined;

  const timeline = shows(share, "timeline")
    ? own(source.timeline)
        .filter((item) => !/breakdown|load-?out/i.test(item.title))
        .slice()
        .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0))
        .map((item) => ({
          id: item.id,
          time: item.time,
          title: item.title,
          segment: SEGMENT_LABEL[item.segment],
          location: item.location,
          owner: item.owner,
          durationMin: item.durationMin,
        }))
    : undefined;

  const files = shows(share, "files")
    ? own(source.documents)
        .filter((d) => !HIDDEN_FILE_KINDS.has(d.kind))
        .map((d) => ({
          id: d.id,
          title: d.title,
          kind: DOC_KIND_LABEL[d.kind],
          status: d.status,
          amount: d.amount,
          url: d.url.trim() ? d.url : null,
        }))
        .sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0))
    : undefined;

  const lines = own(source.budgetLines);
  const budget = shows(share, "budget") ? coupleBudget(lines, wedding.budgetTarget) : undefined;

  const payments = shows(share, "payments")
    ? {
        outgoing: paymentSide(own(source.payments).filter((p) => p.direction === "outgoing"), today),
        incoming: paymentSide(own(source.payments).filter((p) => p.direction === "incoming"), today),
      }
    : undefined;

  const vendorById = new Map(source.vendors.map((v) => [v.id, v]));
  const vendors = shows(share, "vendors")
    ? own(source.bookings)
        .filter((b) => b.stage === "booked")
        .flatMap((b) => {
          const vendor = vendorById.get(b.vendorId);
          if (!vendor) return [];
          return [
            {
              id: b.id,
              name: vendor.name,
              category: VENDOR_CATEGORY_LABEL[vendor.category],
              contactName: vendor.contactName,
              phone: vendor.phone,
              arrival: b.arrivalTime,
            },
          ];
        })
        .sort((a, b) => (a.category < b.category ? -1 : a.category > b.category ? 1 : a.name < b.name ? -1 : 1))
    : undefined;

  const guestRows = own(source.guests);
  const guests = shows(share, "guests")
    ? {
        summary: guestSummary(guestRows),
        rows: guestRows
          .slice()
          .sort((a, b) => {
            const nameA = `${a.lastName} ${a.firstName}`;
            const nameB = `${b.lastName} ${b.firstName}`;
            return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
          })
          .map((g) => ({
            id: g.id,
            name: `${g.firstName} ${g.lastName}`,
            household: g.household,
            rsvp: g.rsvp,
            meal: g.meal,
            dietary: g.dietary,
            role: g.role,
            table: g.table,
            isChild: g.isChild,
            isPlusOne: g.isPlusOne,
          })),
      }
    : undefined;

  return {
    closed: false,
    brand: source.workspaceName,
    title: wedding.title,
    date: wedding.date,
    ceremonyTime: wedding.ceremonyTime,
    city: wedding.city,
    ceremony: CEREMONY_LABEL[wedding.ceremonyType],
    style: wedding.style,
    venueName: venue?.name ?? null,
    venueAddress: venue?.address ?? null,
    rainPlan: wedding.rainPlan.trim(),
    guestEstimate: wedding.guestEstimate,
    countdown: countdownLabel(daysUntil(wedding, today)),
    phase: weddingPhase(wedding, today),
    tasks,
    timeline,
    files,
    budget,
    payments,
    vendors,
    guests,
  };
}

function coupleBudget(lines: BudgetLine[], target: number): PortalBudget {
  const categories = budgetByCategory(lines).map((c) => ({ category: c.category, projected: c.projected }));
  if (lines.length === 0) {
    return { target, projected: null, remaining: null, overBudget: false, categories };
  }
  const summary = budgetSummary(lines, target);
  return {
    target: summary.target,
    projected: summary.projected,
    remaining: summary.remaining,
    overBudget: summary.overBudget,
    categories,
  };
}

function paymentSide(rows: Payment[], today: string): PortalPaymentSide {
  const sorted = rows.slice().sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
  return {
    rows: sorted.map((p) => ({
      id: p.id,
      label: p.label,
      amount: p.amount,
      dueDate: p.dueDate,
      state: paymentState(p, today),
    })),
    totals: paymentTotals(sorted, today),
  };
}
