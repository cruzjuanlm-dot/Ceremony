/**
 * Ceremony's domain model. Shaped like the Supabase tables it will become: every row has a
 * string `id`, foreign keys are `<thing>Id`, money is a plain number of dollars, dates are
 * ISO strings (`YYYY-MM-DD` for days, full ISO for instants).
 *
 * Mapping to Libretto (deliberate, so ideas port both ways):
 *   wedding          ≈ event          (the atomic unit — owns its budget, guests, day-of)
 *   budgetLines      ≈ expense_lines  (estimate AND actual on every line)
 *   bookings         ≈ vendor pipeline rows on an event
 *   timeline         ≈ schedule / day sheet
 *   roomBlocks       ≈ hospitality hotels
 */

export type Plan = "pro" | "diy";

export interface Workspace {
  plan: Plan;
  /** Pro: the planning business ("Brisa Weddings"). DIY: the couple ("Ana & Luis"). */
  name: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
}

export type ClientStatus = "inquiry" | "proposal" | "booked" | "completed" | "lost";
export type ServiceLevel = "full" | "partial" | "day_of";

/** Pro only — the couple as the planner's customer. DIY workspaces have no clients. */
export interface Client {
  id: string;
  partner1: string;
  partner2: string;
  email: string;
  phone: string;
  status: ClientStatus;
  serviceLevel: ServiceLevel;
  /** The planner's own fee for this couple (what the couple pays the planner). */
  planningFee: number;
  source: string;
  language: "en" | "es";
  notes: string;
  createdAt: string;
}

export type CeremonyType = "catholic" | "civil" | "christian" | "jewish" | "interfaith" | "symbolic";

export interface Wedding {
  id: string;
  /** Pro: the client this wedding belongs to. DIY: null. */
  clientId: string | null;
  /** Display name — usually "Partner & Partner". */
  title: string;
  date: string | null;
  ceremonyTime: string | null;
  venueId: string | null;
  ceremonyVenueId: string | null;
  city: string;
  guestEstimate: number;
  /** The couple's target all-in budget. Lines can exceed it — that's the point of tracking. */
  budgetTarget: number;
  ceremonyType: CeremonyType;
  destination: boolean;
  style: string;
  /** Free-form "important notes" — surfaced on the dashboard grid. */
  importantNotes: string;
  /** Rain plan / contingencies. Florida + Puerto Rico weddings are outdoors a lot. */
  rainPlan: string;
  createdAt: string;
}

export type VendorCategory =
  | "venue"
  | "catering"
  | "photography"
  | "videography"
  | "florals"
  | "music"
  | "officiant"
  | "beauty"
  | "attire"
  | "cake"
  | "rentals"
  | "lighting"
  | "stationery"
  | "transportation"
  | "accommodation"
  | "planning"
  | "other";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  instagram: string;
  /** Pro: the planner's preferred-vendor list. */
  preferred: boolean;
  notes: string;
  /** Venue-only extras. */
  capacity?: number;
  indoorOutdoor?: "indoor" | "outdoor" | "both";
  address?: string;
}

export type BookingStage = "researching" | "contacted" | "quoted" | "booked" | "declined";

/** A vendor's involvement in one wedding — the per-wedding vendor pipeline. */
export interface Booking {
  id: string;
  weddingId: string;
  vendorId: string;
  stage: BookingStage;
  /** Agreed (or quoted) total. Booking a vendor is what makes this a real cost. */
  amount: number | null;
  /** Day-of arrival, "HH:MM". Feeds the vendor call sheet. */
  arrivalTime: string | null;
  notes: string;
}

export type BudgetCategory =
  | "Venue & catering"
  | "Photo & video"
  | "Florals & decor"
  | "Music & entertainment"
  | "Attire & beauty"
  | "Ceremony"
  | "Stationery"
  | "Rentals & lighting"
  | "Cake & desserts"
  | "Transportation"
  | "Guest experience"
  | "Planning"
  | "Rings"
  | "Gratuities"
  | "Other";

/** One budget line. Every line carries estimate AND actual (Libretto's rule). */
export interface BudgetLine {
  id: string;
  weddingId: string;
  category: BudgetCategory;
  description: string;
  estimate: number | null;
  actual: number | null;
  bookingId: string | null;
  /** Who's paying — common for parents/padrinos to cover specific items. */
  paidBy: "couple" | "family" | "other";
}

export type PaymentDirection = "incoming" | "outgoing";

/**
 * A scheduled payment. `incoming` = couple → planner (Pro only: the planner's fee
 * installments). `outgoing` = couple/planner → vendor (deposits, milestones, final balance).
 */
export interface Payment {
  id: string;
  weddingId: string;
  direction: PaymentDirection;
  /** outgoing: the vendor's booking. incoming: null. */
  bookingId: string | null;
  label: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
}

export type TaskOwner = "planner" | "couple" | "vendor";

export interface Task {
  id: string;
  weddingId: string | null;
  title: string;
  dueDate: string | null;
  done: boolean;
  owner: TaskOwner;
  /** Checklist phase — e.g. "12+ months", "6 months", "Week of". */
  phase: string;
}

export type TimelineSegment =
  | "getting_ready"
  | "ceremony"
  | "photos"
  | "cocktail"
  | "reception"
  | "after";

/** One line of the wedding-day run of show. */
export interface TimelineItem {
  id: string;
  weddingId: string;
  time: string; // "HH:MM"
  durationMin: number;
  title: string;
  segment: TimelineSegment;
  location: string;
  /** Who runs it — a vendor booking or a free-text person ("Maid of honor"). */
  owner: string;
  notes: string;
}

export type RsvpStatus = "pending" | "attending" | "declined";
export type MealChoice = "beef" | "fish" | "chicken" | "vegetarian" | "kids";

export interface Guest {
  id: string;
  weddingId: string;
  /** Invitations go to households ("The Rivera family"), not individuals. */
  household: string;
  firstName: string;
  lastName: string;
  side: "partner1" | "partner2" | "both";
  list: "A" | "B";
  rsvp: RsvpStatus;
  meal: MealChoice | null;
  dietary: string;
  isPlusOne: boolean;
  isChild: boolean;
  /** Wedding party / honor role: "Maid of honor", "Padrino de arras", "Flower girl"… */
  role: string;
  table: number | null;
  email: string;
}

export interface RoomBlock {
  id: string;
  weddingId: string;
  hotel: string;
  rate: number;
  roomsHeld: number;
  roomsBooked: number;
  cutoffDate: string;
  bookingLink: string;
}

export type AppointmentKind =
  | "consultation"
  | "venue_visit"
  | "tasting"
  | "fitting"
  | "meeting"
  | "rehearsal"
  | "call";

export interface Appointment {
  id: string;
  weddingId: string | null;
  title: string;
  kind: AppointmentKind;
  start: string; // ISO instant
  end: string;
  location: string;
}

export interface Email {
  id: string;
  threadId: string;
  weddingId: string | null;
  vendorId: string | null;
  clientId: string | null;
  direction: "in" | "out";
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string; // ISO instant
  read: boolean;
}

export type DocumentKind =
  | "contract"
  | "proposal"
  | "invoice"
  | "insurance"
  | "license"
  | "floor_plan"
  | "other";
export type DocumentStatus = "draft" | "sent" | "signed" | "paid" | "expired" | "filed";

export interface DocumentRecord {
  id: string;
  weddingId: string | null;
  vendorId: string | null;
  clientId: string | null;
  kind: DocumentKind;
  title: string;
  status: DocumentStatus;
  amount: number | null;
  updatedAt: string;
  /** External link (Drive, Dropbox, DocuSign…) — the prototype stores links, not files. */
  url: string;
  notes: string;
}

/** Everything the store holds, keyed by table name. */
export interface Tables {
  clients: Client;
  weddings: Wedding;
  vendors: Vendor;
  bookings: Booking;
  budgetLines: BudgetLine;
  payments: Payment;
  tasks: Task;
  timeline: TimelineItem;
  guests: Guest;
  roomBlocks: RoomBlock;
  appointments: Appointment;
  emails: Email;
  documents: DocumentRecord;
}

export type TableName = keyof Tables;

export interface Dataset {
  workspace: Workspace;
  tables: { [K in TableName]: Tables[K][] };
}
