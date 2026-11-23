import type {
  BudgetCategory,
  BudgetLine,
  CeremonyType,
  Client,
  Payment,
  Plan,
  Task,
  TaskOwner,
  TimelineItem,
  Wedding,
} from "./types";
import { addDaysIso, plannerFee, plannerInstallments, todayIso } from "~/lib/finance";
import { jurisdictionOf } from "~/lib/wedding";

/**
 * What a brand-new wedding arrives with. Estimates only — actuals stay blank.
 * Shares are the research doc's budget table (§6), in basis points so they sum
 * to exactly 100%. Checklist offsets are the months-out template (§1.3).
 * PR, FL, and Catholic tasks are only the requirements that doc states outright.
 * Lines it marks "(verify)" stay on the Logistics card.
 * The day-of timeline is the run of show in §1.6, counted from the ceremony time.
 */

interface BudgetShare {
  category: BudgetCategory;
  description: string;
  /** Out of 10,000. The list sums to 10,000. */
  shareBps: number;
}

export const STARTER_BUDGET: readonly BudgetShare[] = [
  { category: "Venue & catering", description: "Venue rental", shareBps: 3000 },
  { category: "Venue & catering", description: "Catering & bar", shareBps: 1700 },
  { category: "Cake & desserts", description: "Wedding cake", shareBps: 100 },
  { category: "Photo & video", description: "Photography", shareBps: 650 },
  { category: "Photo & video", description: "Videography", shareBps: 450 },
  { category: "Florals & decor", description: "Florals & decor", shareBps: 900 },
  { category: "Music & entertainment", description: "DJ / band", shareBps: 700 },
  { category: "Attire & beauty", description: "Wedding attire", shareBps: 500 },
  { category: "Attire & beauty", description: "Hair & makeup", shareBps: 200 },
  { category: "Planning", description: "Planner / coordinator", shareBps: 600 },
  { category: "Rentals & lighting", description: "Rentals", shareBps: 300 },
  { category: "Stationery", description: "Save-the-dates, invitations & favors", shareBps: 200 },
  { category: "Rings", description: "Wedding bands", shareBps: 200 },
  { category: "Transportation", description: "Guest transportation", shareBps: 100 },
  { category: "Ceremony", description: "Officiant, license & ceremony", shareBps: 100 },
  { category: "Gratuities", description: "Vendor gratuities", shareBps: 300 },
];

/** Whole-dollar estimates. Null target leaves every estimate blank. Actual is always blank. */
export function starterBudgetLines(target: number | null, plan: Plan): Omit<BudgetLine, "id" | "weddingId">[] {
  const rows = STARTER_BUDGET.map((row) => ({
    category: row.category,
    description: row.category === "Planning" && plan === "diy" ? "Day-of coordinator" : row.description,
    estimate: null as number | null,
    actual: null,
    bookingId: null,
    paidBy: "couple" as const,
    // Percents stay blank until a contract names them. Blank is not zero.
    serviceChargePct: null,
    taxPct: null,
  }));
  if (target == null) return rows;
  const amounts = STARTER_BUDGET.map((row) => Math.round((target * row.shareBps) / 10000));
  const drift = Math.round(target) - amounts.reduce((sum, n) => sum + n, 0);
  if (amounts[0] != null) amounts[0] += drift;
  rows.forEach((row, i) => {
    row.estimate = amounts[i] ?? null;
  });
  return rows;
}

interface TaskTemplate {
  phase: string;
  /** Positive = days before the wedding. Negative = days after. */
  daysBefore: number;
  title: string;
  owner: TaskOwner;
  /** Dropped when a PR or FL pack replaces it. */
  license?: boolean;
}

const CORE_TASKS: readonly TaskTemplate[] = [
  { phase: "12+ months", daysBefore: 420, title: "Set the budget and who contributes", owner: "couple" },
  { phase: "12+ months", daysBefore: 400, title: "Draft the guest list (A and B lists)", owner: "couple" },
  { phase: "12+ months", daysBefore: 390, title: "Pick the date", owner: "couple" },
  { phase: "12+ months", daysBefore: 380, title: "Book the venue", owner: "planner" },
  { phase: "12+ months", daysBefore: 360, title: "Book the photographer and videographer", owner: "planner" },
  { phase: "9–12 months", daysBefore: 330, title: "Book the caterer", owner: "planner" },
  { phase: "9–12 months", daysBefore: 320, title: "Book the band or DJ and the florist", owner: "planner" },
  { phase: "9–12 months", daysBefore: 300, title: "Reserve hotel room blocks", owner: "planner" },
  { phase: "9–12 months", daysBefore: 240, title: "Send save-the-dates", owner: "couple" },
  { phase: "9–12 months", daysBefore: 220, title: "Shop for attire", owner: "couple" },
  { phase: "6–9 months", daysBefore: 210, title: "Book hair and makeup, cake, rentals, and transportation", owner: "planner" },
  { phase: "6–9 months", daysBefore: 200, title: "Hold the design meeting for decor and florals", owner: "planner" },
  { phase: "6–9 months", daysBefore: 180, title: "Plan the rehearsal dinner and welcome party", owner: "couple" },
  { phase: "4–6 months", daysBefore: 150, title: "Do the menu tasting", owner: "couple" },
  { phase: "4–6 months", daysBefore: 140, title: "Order invitations", owner: "couple" },
  { phase: "4–6 months", daysBefore: 130, title: "Buy the rings", owner: "couple" },
  { phase: "4–6 months", daysBefore: 120, title: "Choose padrinos and madrinas", owner: "couple" },
  { phase: "4–6 months", daysBefore: 110, title: "Schedule attire fittings", owner: "couple" },
  { phase: "2–4 months", daysBefore: 70, title: "Apply for the marriage license", owner: "couple", license: true },
  { phase: "2–4 months", daysBefore: 56, title: "Mail invitations", owner: "couple" },
  { phase: "2–4 months", daysBefore: 50, title: "Draft the day-of timeline", owner: "planner" },
  { phase: "1–2 months", daysBefore: 21, title: "Finalize the headcount, meal counts, and seating chart", owner: "planner" },
  { phase: "1–2 months", daysBefore: 14, title: "Send the final timeline to vendors and make final payments", owner: "planner" },
  { phase: "1–2 months", daysBefore: 7, title: "Prepare tip envelopes", owner: "planner" },
  { phase: "Week of", daysBefore: 2, title: "Hold the rehearsal and deliver welcome bags", owner: "planner" },
  { phase: "Week of", daysBefore: 1, title: "Assemble the emergency kit and confirm vendor arrival times", owner: "planner" },
  { phase: "After", daysBefore: -7, title: "Return rentals and pay remaining balances", owner: "planner" },
  { phase: "After", daysBefore: -14, title: "Send thank-you notes", owner: "couple" },
  { phase: "After", daysBefore: -3, title: "Confirm the officiant filed the license", owner: "couple" },
];

/** Research §1.10, only the requirements it states. Offsets are the ones that section recommends. */
const PR_TASKS: readonly TaskTemplate[] = [
  { phase: "Final weeks", daysBefore: 10, title: "Get the Puerto Rico medical certificate (valid 10 days)", owner: "couple" },
  {
    phase: "Week of",
    daysBefore: 7,
    title: "Apply for the marriage license (photo ID, birth certificate, two witnesses 21+)",
    owner: "couple",
  },
  { phase: "Week of", daysBefore: 7, title: "Non-residents: $150 Rentas Internas stamp and a non-residency statement", owner: "couple" },
];

const FL_TASKS: readonly TaskTemplate[] = [
  {
    phase: "1–2 months",
    daysBefore: 30,
    title: "Apply for the Florida marriage license (valid 60 days; residents without the course wait 3 days)",
    owner: "couple",
  },
];

/** Research §1.11. The home-parish letter is marked verify, so it is not a task. */
const CATHOLIC_TASKS: readonly TaskTemplate[] = [
  { phase: "9–12 months", daysBefore: 300, title: "Contact the parish", owner: "couple" },
  { phase: "6–9 months", daysBefore: 210, title: "Start Pre-Cana / cursillo prematrimonial", owner: "couple" },
  { phase: "6–9 months", daysBefore: 180, title: "Request a recently issued baptismal certificate", owner: "couple" },
  { phase: "6–9 months", daysBefore: 180, title: "Gather confirmation and communion records", owner: "couple" },
  { phase: "4–6 months", daysBefore: 120, title: "Prenuptial interview and freedom-to-marry forms", owner: "couple" },
];

const OFFICIANT_TASK: TaskTemplate = {
  phase: "9–12 months",
  daysBefore: 280,
  title: "Book the officiant",
  owner: "couple",
};

function shiftDue(date: string | null, daysBefore: number): string | null {
  if (!date) return null;
  return addDaysIso(date, -daysBefore);
}

export function starterTasks(input: {
  date: string | null;
  ceremonyType: CeremonyType;
  city: string;
  plan: Plan;
}): Omit<Task, "id" | "weddingId">[] {
  const jurisdiction = jurisdictionOf(input.city);
  const templates: TaskTemplate[] = [
    ...CORE_TASKS.filter((t) => !(t.license && jurisdiction)),
    ...(input.ceremonyType === "catholic" ? CATHOLIC_TASKS : [OFFICIANT_TASK]),
    ...(jurisdiction === "PR" ? PR_TASKS : []),
    ...(jurisdiction === "FL" ? FL_TASKS : []),
  ];
  return templates.map((t) => ({
    title: t.title,
    dueDate: shiftDue(input.date, t.daysBefore),
    done: false,
    owner: input.plan === "diy" && t.owner === "planner" ? "couple" : t.owner,
    phase: t.phase,
  }));
}

interface Beat {
  /** Minutes from the ceremony start. Negative = before. */
  offset: number;
  dur: number;
  title: string;
  segment: TimelineItem["segment"];
  location: string;
  owner: string;
  notes: string;
}

function clock(ceremonyTime: string, offsetMin: number): string {
  const [h, m] = ceremonyTime.split(":").map(Number);
  const mins = (((h * 60 + m + offsetMin) % 1440) + 1440) % 1440;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** Run of show from research §1.6. Catholic ceremonies run about 60 minutes; others 20–45. */
export function starterTimeline(
  ceremonyTime: string,
  ceremonyType: CeremonyType,
  plan: Plan,
): Omit<TimelineItem, "id" | "weddingId">[] {
  const catholic = ceremonyType === "catholic";
  const ceremony = catholic ? 60 : 35;
  // Blocks that share a place meet at a boundary and do not overlap. Cocktail hour
  // runs beside family photos, in a different place. An empty location is a person
  // moving through the day (the overlap check ignores it).
  const beats: Beat[] = [
    { offset: -300, dur: 150, title: "Hair and makeup", segment: "getting_ready", location: "Getting-ready room", owner: "Hair & makeup", notes: "" },
    { offset: -140, dur: 30, title: "Photographer arrives for detail shots", segment: "getting_ready", location: "", owner: "Photographer", notes: "" },
    { offset: -90, dur: 20, title: "First look", segment: "photos", location: "Garden", owner: "Photographer", notes: "" },
    { offset: -30, dur: 30, title: "Guests arrive and prelude", segment: "ceremony", location: "Ceremony site", owner: "Musicians", notes: "" },
    {
      offset: 0,
      dur: ceremony,
      title: "Ceremony",
      segment: "ceremony",
      location: "Ceremony site",
      owner: "Officiant",
      notes: catholic ? "Mass, readings, vows, arras, lazo, recessional." : "",
    },
    { offset: ceremony, dur: 40, title: "Family photos", segment: "photos", location: "Ceremony site", owner: "Photographer", notes: "" },
    { offset: ceremony, dur: 60, title: "Cocktail hour", segment: "cocktail", location: "Cocktail space", owner: "Caterer", notes: "" },
  ];
  let reception = ceremony + 60;
  const next = (dur: number, title: string, segment: Beat["segment"], location: string, owner: string) => {
    beats.push({ offset: reception, dur, title, segment, location, owner, notes: "" });
    reception += dur;
  };
  next(10, "Grand entrance", "reception", "Reception", "DJ / MC");
  next(8, "First dance", "reception", "Reception", "DJ / MC");
  next(10, "Welcome toast", "reception", "Reception", "DJ / MC");
  next(60, "Dinner service", "reception", "Reception", "Caterer");
  next(15, "Parent dances and toasts", "reception", "Reception", "DJ / MC");
  next(10, "Cake cutting", "reception", "Reception", "Caterer");
  next(90, "Open dancing", "reception", "Reception", "DJ / MC");
  next(15, "Last dance and send-off", "after", "Exit", "DJ / MC");
  next(60, "Vendor load-out", "after", "Venue", plan === "diy" ? "Couple" : "Planner");
  return beats.map((b) => ({
    time: clock(ceremonyTime, b.offset),
    durationMin: b.dur,
    title: b.title,
    segment: b.segment,
    location: b.location,
    owner: b.owner,
    notes: b.notes,
  }));
}

type Insert<T> = (rows: Omit<T, "id">[]) => Promise<unknown>;

/** Writes the starter budget, checklist, timeline, and (Pro) fee installments for a wedding just created. */
export async function writeStarter(
  wedding: Wedding,
  plan: Plan,
  client: Client | null,
  api: {
    insertBudgetLines: Insert<BudgetLine>;
    insertTasks: Insert<Task>;
    insertTimeline: Insert<TimelineItem>;
    insertPayments: Insert<Payment>;
  },
): Promise<void> {
  const target = wedding.budgetTarget > 0 ? wedding.budgetTarget : null;
  const lines = starterBudgetLines(target, plan);
  const fee = plan === "pro" && client ? plannerFee(client, target) : null;
  if (fee != null) {
    const planning = lines.filter((l) => l.category === "Planning");
    if (planning.length === 1 && planning[0]) planning[0].estimate = fee;
  }
  await api.insertBudgetLines(lines.map((l) => ({ ...l, weddingId: wedding.id })));
  await api.insertTasks(
    starterTasks({
      date: wedding.date,
      ceremonyType: wedding.ceremonyType,
      city: wedding.city,
      plan,
    }).map((t) => ({ ...t, weddingId: wedding.id })),
  );
  await api.insertTimeline(
    starterTimeline(wedding.ceremonyTime ?? "17:00", wedding.ceremonyType, plan).map((t) => ({
      ...t,
      weddingId: wedding.id,
    })),
  );
  if (fee != null && wedding.date) {
    await api.insertPayments(
      plannerInstallments(fee, wedding.date, todayIso()).map((p) => ({
        weddingId: wedding.id,
        direction: "incoming" as const,
        bookingId: null,
        label: p.label,
        amount: p.amount,
        dueDate: p.dueDate,
        paidDate: null,
        method: null,
      })),
    );
  }
}
