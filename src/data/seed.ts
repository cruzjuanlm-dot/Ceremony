import type {
  Appointment,
  BudgetCategory,
  BudgetLine,
  Booking,
  BookingStage,
  CeremonyType,
  Client,
  Dataset,
  DocumentRecord,
  Email,
  Guest,
  MealChoice,
  Payment,
  Plan,
  RoomBlock,
  ServiceLevel,
  ClientStatus,
  Task,
  TimelineItem,
  Vendor,
  VendorCategory,
  VenueQuote,
  Wedding,
} from "./types";

/**
 * Demo seed. Every date is an OFFSET from "today" (the moment the dataset is first created),
 * so the prototype always shows a wedding this week, overdue payments, RSVPs trickling in —
 * never a stale snapshot. A seeded PRNG keeps the output identical for the same day.
 *
 * All businesses and people are fictional.
 */

/* ---------- helpers ------------------------------------------------------------------ */

function prng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function addDays(base: Date, n: number) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

/** Weddings land on Saturdays. */
function saturdayNear(base: Date, n: number) {
  const d = addDays(base, n);
  const shift = (6 - d.getDay() + 7) % 7;
  return addDays(d, shift);
}

function at(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  return d.toISOString();
}

const minutesToHHMM = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const hhmmToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const round50 = (n: number) => Math.round(n / 50) * 50;

let counter = 0;
const id = (p: string) => `${p}_${(++counter).toString(36).padStart(4, "0")}`;

/* ---------- vendor directory --------------------------------------------------------- */

type VendorSeed = Omit<Vendor, "id">;

const V = (
  name: string,
  category: VendorCategory,
  contactName: string,
  city: string,
  extra: Partial<VendorSeed> = {},
): VendorSeed => {
  const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return {
    name,
    category,
    contactName,
    email: `${contactName.split(" ")[0].toLowerCase()}@${handle.slice(0, 18)}.example`,
    phone: city.includes("FL")
      ? `(305) 555-${String(1000 + handle.length * 37).slice(-4)}`
      : `(787) 555-${String(1000 + handle.length * 41).slice(-4)}`,
    city,
    instagram: `@${handle.slice(0, 20)}`,
    preferred: false,
    notes: "",
    ...extra,
  };
};

const PRO_VENDORS: VendorSeed[] = [
  V("Hacienda Las Palmas", "venue", "Rosa Méndez", "Dorado, PR", {
    preferred: true,
    capacity: 250,
    indoorOutdoor: "both",
    address: "Carr. 693 Km 8.2, Dorado, PR",
    notes: "Covered terrace is the rain plan. Generator on site. Load-in via service road only.",
  }),
  V("Casa Coralina Old San Juan", "venue", "Álvaro Pagán", "San Juan, PR", {
    preferred: true,
    capacity: 180,
    indoorOutdoor: "both",
    address: "Calle del Cristo, Viejo San Juan, PR",
    notes: "Courtyard fits 180 seated. Street parking is impossible — book valet or shuttles.",
  }),
  V("Villa Marbella Rincón", "venue", "Kelsey Ward", "Rincón, PR", {
    capacity: 120,
    indoorOutdoor: "outdoor",
    address: "Sector Puntas, Rincón, PR",
    notes: "Sunset ceremonies on the lawn. Tent required Jun–Nov (hurricane season).",
  }),
  V("Hacienda Monte Alto", "venue", "Luis Ortega", "Ponce, PR", {
    capacity: 300,
    indoorOutdoor: "both",
    address: "Carr. 14, Ponce, PR",
  }),
  V("The Bayfront Estate", "venue", "Melissa Grant", "Miami, FL", {
    preferred: true,
    capacity: 220,
    indoorOutdoor: "both",
    address: "Biscayne Bay, Miami, FL",
    notes: "Noise curfew 11pm. Requires $2M liability COI from every vendor.",
  }),
  V("Magnolia House St. Augustine", "venue", "Grace Holloway", "St. Augustine, FL", {
    capacity: 150,
    indoorOutdoor: "both",
  }),
  V("Sabor Isleño Catering", "catering", "Chef Ramón Vélez", "San Juan, PR", {
    preferred: true,
    notes: "Lechón station is the crowd favorite. Needs final headcount 10 days out.",
  }),
  V("Coastal Table Co.", "catering", "Priya Shah", "Miami, FL"),
  V("Luz de Tarde Photography", "photography", "Gabriela Rosado", "San Juan, PR", {
    preferred: true,
  }),
  V("Hartwell Studio", "photography", "Ben Hartwell", "Miami, FL"),
  V("Reel Isla Films", "videography", "Tomás Acevedo", "Carolina, PR"),
  V("Flor y Canto Florals", "florals", "Daniela Cruz", "Guaynabo, PR", { preferred: true }),
  V("Petal & Palm", "florals", "Hannah Lee", "Fort Lauderdale, FL"),
  V("Orquesta Tropicana", "music", "Héctor Rivera", "Bayamón, PR", {
    notes: "12-piece salsa orchestra. Needs a 20×16 stage and 2 dedicated circuits.",
  }),
  V("DJ Marea", "music", "Carlos Marrero", "San Juan, PR", { preferred: true }),
  V("Padre Miguel Santana", "officiant", "Padre Miguel Santana", "San Juan, PR", {
    notes: "Requires Pre-Cana certificate and baptismal records 3 months ahead.",
  }),
  V("Rev. Linda Moore", "officiant", "Linda Moore", "Miami, FL"),
  V("Glam Isla Beauty", "beauty", "Yamilet Ortiz", "San Juan, PR", { preferred: true }),
  V("La Dulcería Cakes", "cake", "Maribel Soto", "Caguas, PR"),
  V("Isla Event Rentals", "rentals", "Pedro Nazario", "Toa Baja, PR", { preferred: true }),
  V("Lumen Lighting PR", "lighting", "José Figueroa", "San Juan, PR"),
  V("Papel Fino Stationery", "stationery", "Andrea Vidal", "San Juan, PR"),
  V("Caribe Shuttle & Limo", "transportation", "Rafael Quiñones", "Carolina, PR"),
  V("Dorado Bay Resort", "accommodation", "Group Sales", "Dorado, PR"),
];

const DIY_VENDORS: VendorSeed[] = [
  V("Hacienda Monte Alto", "venue", "Luis Ortega", "Ponce, PR", {
    capacity: 300,
    indoorOutdoor: "both",
    address: "Carr. 14, Ponce, PR",
    notes: "Includes tables, chairs and a coordinator for the day. Rain plan: the old coffee barn.",
  }),
  V("Sabor Isleño Catering", "catering", "Chef Ramón Vélez", "San Juan, PR"),
  V("Luz de Tarde Photography", "photography", "Gabriela Rosado", "San Juan, PR"),
  V("Reel Isla Films", "videography", "Tomás Acevedo", "Carolina, PR"),
  V("Flor y Canto Florals", "florals", "Daniela Cruz", "Guaynabo, PR"),
  V("DJ Marea", "music", "Carlos Marrero", "San Juan, PR"),
  V("Parroquia San Antonio (Ponce)", "officiant", "Oficina parroquial", "Ponce, PR"),
  V("Glam Isla Beauty", "beauty", "Yamilet Ortiz", "San Juan, PR"),
  V("La Dulcería Cakes", "cake", "Maribel Soto", "Caguas, PR"),
  V("Papel Fino Stationery", "stationery", "Andrea Vidal", "San Juan, PR"),
  V("Caribe Shuttle & Limo", "transportation", "Rafael Quiñones", "Carolina, PR"),
];

/* ---------- templates ---------------------------------------------------------------- */

/**
 * Typical share of a US wedding budget by line (blend of WeddingWire / Joy / WalletHub — see
 * docs/WEDDING_INDUSTRY_RESEARCH.md). Sums to 1.0 of the TARGET; real couples also keep a
 * 5–10% unassigned buffer, which is why seeded projections land near, not on, the target.
 */
const BUDGET_SPLIT: { category: BudgetCategory; lines: [string, number][] }[] = [
  { category: "Venue & catering", lines: [["Venue rental", 0.3], ["Catering & bar", 0.17]] },
  { category: "Photo & video", lines: [["Photography", 0.065], ["Videography", 0.045]] },
  { category: "Florals & decor", lines: [["Florals", 0.09]] },
  { category: "Music & entertainment", lines: [["DJ / band", 0.07]] },
  { category: "Attire & beauty", lines: [["Wedding attire", 0.05], ["Hair & makeup", 0.02]] },
  { category: "Planning", lines: [["Planner / coordinator", 0.06]] },
  { category: "Rentals & lighting", lines: [["Rentals & lighting", 0.03]] },
  { category: "Gratuities", lines: [["Vendor tips", 0.03]] },
  { category: "Stationery", lines: [["Save-the-dates & invitations", 0.02]] },
  { category: "Rings", lines: [["Wedding bands", 0.02]] },
  { category: "Cake & desserts", lines: [["Wedding cake", 0.01]] },
  { category: "Transportation", lines: [["Guest shuttles", 0.01]] },
  { category: "Ceremony", lines: [["Officiant / church & license", 0.01]] },
];

/** Payment installments by vendor type: [label, share of contract, days before wedding | "signing"]. */
const PAYMENT_PLAN: Partial<Record<VendorCategory, [string, number, number | "signing"][]>> = {
  venue: [["Deposit", 0.5, "signing"], ["Second payment", 0.25, 180], ["Final balance", 0.25, 30]],
  catering: [["Deposit", 0.3, "signing"], ["Second payment", 0.4, 90], ["Final balance", 0.3, 14]],
  photography: [["Retainer", 0.4, "signing"], ["Final balance", 0.6, 14]],
  videography: [["Retainer", 0.4, "signing"], ["Final balance", 0.6, 14]],
  beauty: [["Retainer", 0.3, "signing"], ["Balance (day of)", 0.7, 0]],
};
const DEFAULT_PLAN: [string, number, number | "signing"][] = [
  ["Deposit", 0.5, "signing"],
  ["Second payment", 0.25, 60],
  ["Final balance", 0.25, 14],
];

const LINE_VENDOR: Record<string, VendorCategory> = {
  "Venue rental": "venue",
  "Catering & bar": "catering",
  Photography: "photography",
  Videography: "videography",
  Florals: "florals",
  "DJ / band": "music",
  "Hair & makeup": "beauty",
  "Rentals & lighting": "rentals",
  "Officiant / church & license": "officiant",
  "Save-the-dates & invitations": "stationery",
  "Wedding cake": "cake",
  "Guest shuttles": "transportation",
};

/** When each vendor typically gets booked, in days before the wedding. */
const BOOK_LEAD: Record<string, number> = {
  venue: 400,
  catering: 330,
  photography: 320,
  videography: 280,
  music: 260,
  officiant: 240,
  florals: 210,
  beauty: 180,
  rentals: 150,
  stationery: 170,
  cake: 120,
  transportation: 100,
};

const CHECKLIST: { phase: string; daysBefore: number; title: string; owner: Task["owner"] }[] = [
  { phase: "12+ months", daysBefore: 400, title: "Set the budget and top three priorities", owner: "couple" },
  { phase: "12+ months", daysBefore: 390, title: "Draft the guest list (A and B lists)", owner: "couple" },
  { phase: "12+ months", daysBefore: 380, title: "Book the venue", owner: "planner" },
  { phase: "12+ months", daysBefore: 360, title: "Choose the wedding party and padrinos", owner: "couple" },
  { phase: "9–12 months", daysBefore: 330, title: "Book photographer and videographer", owner: "planner" },
  { phase: "9–12 months", daysBefore: 320, title: "Book caterer and schedule a tasting", owner: "planner" },
  { phase: "9–12 months", daysBefore: 300, title: "Reserve hotel room blocks", owner: "planner" },
  { phase: "9–12 months", daysBefore: 290, title: "Launch the wedding website", owner: "couple" },
  { phase: "6–9 months", daysBefore: 250, title: "Book band or DJ", owner: "planner" },
  { phase: "6–9 months", daysBefore: 240, title: "Confirm officiant or church; start Pre-Cana if Catholic", owner: "couple" },
  { phase: "6–9 months", daysBefore: 220, title: "Send save-the-dates", owner: "couple" },
  { phase: "6–9 months", daysBefore: 210, title: "Book florist and finalize the design", owner: "planner" },
  { phase: "6–9 months", daysBefore: 190, title: "Order the dress and attire", owner: "couple" },
  { phase: "4–6 months", daysBefore: 170, title: "Book hair and makeup trial", owner: "couple" },
  { phase: "4–6 months", daysBefore: 150, title: "Book rentals and lighting", owner: "planner" },
  { phase: "4–6 months", daysBefore: 130, title: "Order the cake after a tasting", owner: "couple" },
  { phase: "4–6 months", daysBefore: 120, title: "Plan the rehearsal dinner and welcome party", owner: "planner" },
  { phase: "2–4 months", daysBefore: 100, title: "Book guest transportation", owner: "planner" },
  { phase: "2–4 months", daysBefore: 70, title: "Buy the rings", owner: "couple" },
  { phase: "2–4 months", daysBefore: 60, title: "Mail invitations", owner: "couple" },
  { phase: "2–4 months", daysBefore: 50, title: "Gather marriage license documents", owner: "couple" },
  { phase: "1–2 months", daysBefore: 35, title: "RSVP deadline — chase missing replies", owner: "couple" },
  { phase: "1–2 months", daysBefore: 28, title: "Draft the day-of timeline and share with vendors", owner: "planner" },
  { phase: "1–2 months", daysBefore: 21, title: "Finalize the seating chart", owner: "couple" },
  { phase: "Final weeks", daysBefore: 12, title: "Send the final headcount and meals to the caterer", owner: "planner" },
  { phase: "Final weeks", daysBefore: 10, title: "Confirm every vendor's arrival time", owner: "planner" },
  { phase: "Final weeks", daysBefore: 7, title: "Prepare tip envelopes and final payments", owner: "planner" },
  { phase: "Week of", daysBefore: 3, title: "Pack the day-of emergency kit", owner: "planner" },
  { phase: "Week of", daysBefore: 1, title: "Run the rehearsal", owner: "planner" },
];

const TIMELINE: { offset: number; dur: number; title: string; segment: TimelineItem["segment"]; location: string; owner: string }[] = [
  { offset: -300, dur: 180, title: "Hair and makeup begins", segment: "getting_ready", location: "Bridal suite", owner: "Hair & makeup" },
  { offset: -210, dur: 30, title: "Photographer arrives; detail shots", segment: "getting_ready", location: "Bridal suite", owner: "Photographer" },
  { offset: -150, dur: 30, title: "Florist delivers bouquets and boutonnieres", segment: "getting_ready", location: "Bridal suite", owner: "Florist" },
  { offset: -120, dur: 30, title: "Getting dressed", segment: "getting_ready", location: "Bridal suite", owner: "Maid of honor" },
  { offset: -90, dur: 20, title: "First look", segment: "photos", location: "Garden", owner: "Photographer" },
  { offset: -65, dur: 30, title: "Wedding party and padrinos photos", segment: "photos", location: "Garden", owner: "Photographer" },
  { offset: -30, dur: 30, title: "Guests arrive; prelude music", segment: "ceremony", location: "Ceremony site", owner: "Musicians" },
  { offset: 0, dur: 35, title: "Ceremony", segment: "ceremony", location: "Ceremony site", owner: "Officiant" },
  { offset: 35, dur: 25, title: "Family formal photos", segment: "photos", location: "Ceremony site", owner: "Photographer" },
  { offset: 45, dur: 60, title: "Cocktail hour", segment: "cocktail", location: "Terrace", owner: "Caterer" },
  { offset: 105, dur: 10, title: "Grand entrance", segment: "reception", location: "Ballroom", owner: "DJ / MC" },
  { offset: 115, dur: 8, title: "First dance", segment: "reception", location: "Ballroom", owner: "DJ / MC" },
  { offset: 125, dur: 60, title: "Dinner service and toasts", segment: "reception", location: "Ballroom", owner: "Caterer" },
  { offset: 195, dur: 10, title: "Parent dances", segment: "reception", location: "Ballroom", owner: "DJ / MC" },
  { offset: 210, dur: 10, title: "Cake cutting", segment: "reception", location: "Ballroom", owner: "Caterer" },
  { offset: 225, dur: 30, title: "Hora loca", segment: "reception", location: "Ballroom", owner: "DJ / MC" },
  { offset: 330, dur: 15, title: "Last dance and sparkler send-off", segment: "after", location: "Front drive", owner: "Planner" },
  { offset: 345, dur: 90, title: "Vendor breakdown and load-out", segment: "after", location: "Venue", owner: "Planner" },
];

const FIRST_ES = ["María", "José", "Carmen", "Luis", "Ana", "Carlos", "Lucía", "Javier", "Elena", "Miguel", "Rosa", "Pedro", "Isabel", "Rafael", "Gloria", "Fernando", "Marta", "Héctor", "Teresa", "Ángel", "Paola", "Ricardo", "Yolanda", "Manuel", "Adriana", "Jorge", "Beatriz", "Alejandro", "Diana", "Eduardo"];
const LAST_ES = ["Rivera", "Rodríguez", "Colón", "Torres", "Ortiz", "Vázquez", "Santiago", "Díaz", "Cruz", "Morales", "Ramos", "Rosario", "Figueroa", "Medina", "Nieves", "Pagán", "Acevedo", "Quiñones", "Soto", "Maldonado"];
const FIRST_EN = ["Emma", "Liam", "Olivia", "Noah", "Ava", "James", "Sophia", "Benjamin", "Mia", "Lucas", "Charlotte", "Henry", "Amelia", "Jack", "Harper", "Owen", "Ella", "Wyatt", "Grace", "Leo"];
const LAST_EN = ["Smith", "Johnson", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Martin", "Clark", "Lewis", "Walker", "Hall", "Young", "King"];

const ROLES = ["Maid of honor", "Best man", "Madrina", "Padrino", "Padrino de arras", "Madrina de lazo", "Bridesmaid", "Groomsman", "Flower girl", "Ring bearer"];

/* ---------- per-wedding generators --------------------------------------------------- */

interface WeddingSpec {
  wedding: Omit<Wedding, "id" | "createdAt">;
  daysOut: number; // negative = already happened
  client?: Omit<Client, "id" | "createdAt">;
  englishGuests?: boolean;
  /** Vendors for this wedding: category → vendor name in the directory. */
  vendors: Partial<Record<VendorCategory, string>>;
  roomBlock?: Omit<RoomBlock, "id" | "weddingId" | "cutoffDate"> & { cutoffDaysBefore: number };
  /** Force a few vendors into an earlier pipeline stage for realism. */
  stageOverrides?: Partial<Record<VendorCategory, BookingStage>>;
}

function build(plan: Plan, specs: WeddingSpec[], vendorSeeds: VendorSeed[], today: Date, rand: () => number): Dataset {
  counter = 0;
  const vendors: Vendor[] = vendorSeeds.map((v) => ({ ...v, id: id("ven") }));
  const byName = new Map(vendors.map((v) => [v.name, v]));

  const t: Dataset["tables"] = {
    clients: [],
    weddings: [],
    vendors,
    bookings: [],
    budgetLines: [],
    payments: [],
    tasks: [],
    timeline: [],
    guests: [],
    roomBlocks: [],
    appointments: [],
    emails: [],
    documents: [],
    venueQuotes: [],
  };

  for (const spec of specs) {
    const wDate = spec.daysOut === Infinity ? null : saturdayNear(today, spec.daysOut);
    const daysOut = wDate ? Math.round((wDate.getTime() - addDays(today, 0).getTime()) / 86400000) : 9999;
    const created = addDays(today, -Math.min(420, Math.max(30, 420 - Math.max(daysOut, 0))));

    let clientId: string | null = null;
    if (spec.client) {
      const c: Client = { ...spec.client, id: id("cli"), createdAt: iso(created) };
      t.clients.push(c);
      clientId = c.id;
    }

    const venue = spec.vendors.venue ? byName.get(spec.vendors.venue) : undefined;
    const ceremonyVenue = spec.vendors.officiant && spec.wedding.ceremonyType === "catholic"
      ? undefined
      : venue;
    const w: Wedding = {
      ...spec.wedding,
      id: id("wed"),
      clientId,
      date: wDate ? iso(wDate) : null,
      venueId: venue?.id ?? null,
      ceremonyVenueId: ceremonyVenue?.id ?? venue?.id ?? null,
      createdAt: iso(created),
    };
    t.weddings.push(w);
    if (!wDate) continue; // an undated inquiry has no plan yet

    const day = (n: number) => addDays(wDate, -n);
    const isPast = (d: Date) => d.getTime() < today.getTime();

    /* bookings + budget + payments */
    const bookingByCat = new Map<VendorCategory, Booking>();
    for (const [cat, name] of Object.entries(spec.vendors) as [VendorCategory, string][]) {
      const v = byName.get(name);
      if (!v) continue;
      const lead = BOOK_LEAD[cat] ?? 200;
      let stage: BookingStage =
        daysOut < lead - 25 ? "booked" : daysOut < lead + 30 ? "quoted" : "researching";
      if (spec.stageOverrides?.[cat]) stage = spec.stageOverrides[cat]!;
      const b: Booking = {
        id: id("bkg"),
        weddingId: w.id,
        vendorId: v.id,
        stage,
        amount: null,
        arrivalTime: null,
        notes: "",
      };
      t.bookings.push(b);
      bookingByCat.set(cat, b);
    }

    const ceremonyMin = hhmmToMinutes(w.ceremonyTime ?? "17:00");
    for (const group of BUDGET_SPLIT) {
      for (const [desc, share] of group.lines) {
        // DIY couples rarely hire a full planner — their line is a day-of coordinator.
        const planningLine = desc === "Planner / coordinator";
        // 0.93: couples keep a 5–10% unassigned buffer, so lines sum to ~93% of the target.
        let estimate = round50(spec.wedding.budgetTarget * 0.93 * share * (planningLine && plan === "diy" ? 0.4 : 1));
        // A Pro client's planning fee is known from day one — it IS the estimate.
        if (planningLine && plan === "pro" && spec.client) estimate = spec.client.planningFee;
        const vCat = LINE_VENDOR[desc];
        const booking = vCat ? bookingByCat.get(vCat) : undefined;
        let actual: number | null = null;
        if (booking && (booking.stage === "booked" || booking.stage === "quoted")) {
          const amount = round50(estimate * (0.84 + rand() * 0.26));
          booking.amount = amount;
          if (booking.stage === "booked") actual = amount;
        }
        if (!booking && daysOut < 0) actual = round50(estimate * (0.9 + rand() * 0.2));
        if (desc === "Wedding attire" && daysOut < 190) actual = round50(estimate * (0.95 + rand() * 0.25));
        if (desc === "Wedding bands" && daysOut < 70) actual = round50(estimate * (0.9 + rand() * 0.3));
        if (planningLine && plan === "pro" && spec.client) actual = spec.client.planningFee;
        t.budgetLines.push({
          id: id("bud"),
          weddingId: w.id,
          category: group.category,
          description: plan === "diy" && planningLine ? "Day-of coordinator" : desc,
          estimate,
          actual,
          bookingId: booking?.id ?? null,
          paidBy: desc === "Catering & bar" && spec.wedding.ceremonyType === "catholic" ? "family" : "couple",
        });
      }
    }

    // Arrival times feed the call sheet.
    const arrivals: Partial<Record<VendorCategory, number>> = {
      beauty: -300, photography: -210, videography: -210, florals: -240, rentals: -420,
      lighting: -360, catering: -240, music: -120, officiant: -45, cake: -150, transportation: -60, venue: -480,
    };
    for (const [cat, b] of bookingByCat) {
      if (b.stage !== "booked") continue;
      const off = arrivals[cat];
      if (off !== undefined) b.arrivalTime = minutesToHHMM(ceremonyMin + off);
      const lead = BOOK_LEAD[cat] ?? 200;
      const bookedOn = day(Math.max(lead - 30, 20));
      const amount = b.amount ?? 0;
      const schedule = (PAYMENT_PLAN[cat] ?? DEFAULT_PLAN).map(
        ([label, share, when]) => [label, share, when === "signing" ? bookedOn : day(when)] as const,
      );
      let scheduled = 0;
      for (const [i, [label, pct, due]] of schedule.entries()) {
        // The last installment takes the exact remainder, so rounding never over/underpays.
        const share = i === schedule.length - 1 ? amount - scheduled : round50(amount * pct);
        scheduled += share;
        // One deliberately overdue payment per near-term wedding, so the Financials
        // "overdue" state has something real to show.
        const overdue = label === "Second payment" && cat === "florals" && daysOut < 50 && daysOut > 0;
        t.payments.push({
          id: id("pay"),
          weddingId: w.id,
          direction: "outgoing",
          bookingId: b.id,
          label,
          amount: share,
          dueDate: iso(due),
          paidDate: isPast(due) && !overdue ? iso(due) : null,
          method: isPast(due) && !overdue ? (rand() > 0.5 ? "ACH" : "Check") : null,
        });
      }
    }

    if (plan === "pro" && spec.client) {
      const fee = spec.client.planningFee;
      const sched: [string, number, Date][] = [
        ["Retainer", 0.4, created],
        ["Midpoint installment", 0.3, day(180)],
        ["Final installment", 0.3, day(30)],
      ];
      for (const [label, pct, due] of sched) {
        const lateClient = label === "Final installment" && daysOut > 0 && daysOut < 30;
        t.payments.push({
          id: id("pay"),
          weddingId: w.id,
          direction: "incoming",
          bookingId: null,
          label,
          amount: round50(fee * pct),
          dueDate: iso(due),
          paidDate: isPast(due) && !lateClient ? iso(due) : null,
          method: isPast(due) && !lateClient ? "Card" : null,
        });
      }
    }

    /* checklist */
    for (const c of CHECKLIST) {
      const due = day(c.daysBefore);
      if (daysOut > 0 && due.getTime() < created.getTime() - 86400000 * 60) continue;
      t.tasks.push({
        id: id("tsk"),
        weddingId: w.id,
        title: c.title,
        dueDate: iso(due),
        // Recently-due tasks are sometimes still open; anything a month stale has been closed.
        done: daysOut < 0 || (isPast(due) && (due.getTime() < today.getTime() - 30 * 86400000 || rand() > 0.35)),
        owner: plan === "diy" && c.owner === "planner" ? "couple" : c.owner,
        phase: c.phase,
      });
    }

    /* day-of timeline — built once the wedding is inside ~6 months */
    if (daysOut < 200) {
      for (const it of TIMELINE) {
        if (plan === "diy" && it.owner === "Planner") continue;
        t.timeline.push({
          id: id("tml"),
          weddingId: w.id,
          time: minutesToHHMM(ceremonyMin + it.offset),
          durationMin: it.dur,
          title: it.title,
          segment: it.segment,
          location: it.location,
          owner: it.owner,
          notes: "",
        });
      }
    }

    /* guests */
    const firsts = spec.englishGuests ? FIRST_EN : FIRST_ES;
    const lasts = spec.englishGuests ? LAST_EN : LAST_ES;
    const invited = daysOut < 60;
    let made = 0;
    let roleIdx = 0;
    const tableSize = 10;
    while (made < spec.wedding.guestEstimate) {
      const last = lasts[Math.floor(rand() * lasts.length)];
      const size = Math.min(spec.wedding.guestEstimate - made, 1 + Math.floor(rand() * 4));
      const side: Guest["side"] = rand() < 0.48 ? "partner1" : rand() < 0.92 ? "partner2" : "both";
      const list: Guest["list"] = made > spec.wedding.guestEstimate * 0.88 ? "B" : "A";
      const responded = invited && rand() < (daysOut < 14 ? 0.95 : 0.72);
      const attending = responded && rand() < 0.86;
      for (let i = 0; i < size; i++) {
        const isChild = size >= 3 && i >= 2;
        const isPlusOne = size === 2 && i === 1 && rand() < 0.4;
        const meal: MealChoice | null = attending
          ? isChild
            ? "kids"
            : (["beef", "fish", "chicken", "vegetarian"] as const)[Math.floor(rand() * 4)]
          : null;
        const g: Guest = {
          id: id("gst"),
          weddingId: w.id,
          household: size > 1 ? `The ${last} family` : `${firsts[0]} ${last}`,
          firstName: firsts[Math.floor(rand() * firsts.length)],
          lastName: last,
          side,
          list,
          rsvp: !responded ? "pending" : attending ? "attending" : "declined",
          meal,
          dietary: attending && rand() < 0.08 ? (["Gluten-free", "Nut allergy", "Shellfish allergy", "Vegan"] as const)[Math.floor(rand() * 4)] : "",
          isPlusOne,
          isChild,
          role: roleIdx < ROLES.length && !isChild && list === "A" && rand() < 0.15 ? ROLES[roleIdx++] : "",
          table: attending && daysOut < 21 ? 1 + Math.floor(made / tableSize) : null,
          email: i === 0 ? `${last.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}${made}@mail.example` : "",
        };
        if (size > 1) g.household = `The ${last} family`;
        else g.household = `${g.firstName} ${g.lastName}`;
        t.guests.push(g);
        made++;
      }
    }

    /* room block */
    if (spec.roomBlock) {
      const { cutoffDaysBefore, ...rb } = spec.roomBlock;
      t.roomBlocks.push({ ...rb, id: id("rbk"), weddingId: w.id, cutoffDate: iso(day(cutoffDaysBefore)) });
    }

    /* documents */
    for (const [cat, b] of bookingByCat) {
      const v = vendors.find((x) => x.id === b.vendorId)!;
      if (b.stage === "booked" || b.stage === "quoted") {
        t.documents.push({
          id: id("doc"),
          weddingId: w.id,
          vendorId: v.id,
          clientId: null,
          kind: b.stage === "booked" ? "contract" : "proposal",
          title: `${v.name} — ${b.stage === "booked" ? "service agreement" : "quote"}`,
          status: b.stage === "booked" ? "signed" : "sent",
          amount: b.amount,
          // Signed when booked — never a date that hasn't happened yet.
          updatedAt: iso(new Date(Math.min(day(Math.max((BOOK_LEAD[cat] ?? 200) - 30, 20)).getTime(), today.getTime()))),
          url: "https://drive.example.com/contract",
          notes: "",
        });
      }
    }
    if (spec.client && plan === "pro") {
      t.documents.push({
        id: id("doc"),
        weddingId: w.id,
        vendorId: null,
        clientId,
        // Only a booked couple has signed; a proposal-stage couple has a proposal out.
        kind: spec.client.status === "proposal" ? "proposal" : "contract",
        title: `${spec.client.status === "proposal" ? "Planning proposal" : "Planning agreement"} — ${w.title}`,
        status: spec.client.status === "proposal" ? "sent" : "signed",
        amount: spec.client.planningFee,
        updatedAt: iso(created),
        url: "https://drive.example.com/planning-agreement",
        notes: `${spec.client.serviceLevel === "full" ? "Full planning" : spec.client.serviceLevel === "partial" ? "Partial planning" : "Day-of coordination"} package.`,
      });
    }
    if (daysOut > 0 && daysOut < 70) {
      t.documents.push({
        id: id("doc"),
        weddingId: w.id,
        vendorId: null,
        clientId,
        kind: "license",
        title: "Marriage license packet",
        status: daysOut < 20 ? "filed" : "draft",
        amount: null,
        updatedAt: iso(addDays(today, -3)),
        url: "",
        notes: "IDs, birth certificates, medical certificate (PR), officiant details.",
      });
    }
    if (venue && daysOut > 0 && daysOut < 120) {
      t.documents.push({
        id: id("doc"),
        weddingId: w.id,
        vendorId: venue.id,
        clientId: null,
        kind: "insurance",
        title: "Event liability insurance (COI)",
        status: daysOut < 45 ? "filed" : "draft",
        amount: 285,
        updatedAt: iso(addDays(today, -10)),
        url: "",
        notes: `Venue requires the certificate naming ${venue.name} as additional insured.`,
      });
      t.documents.push({
        id: id("doc"),
        weddingId: w.id,
        vendorId: venue.id,
        clientId: null,
        kind: "floor_plan",
        title: "Reception floor plan v2",
        status: "sent",
        amount: null,
        updatedAt: iso(addDays(today, -6)),
        url: "",
        notes: "",
      });
    }

    /* appointments around today */
    if (daysOut > 0 && daysOut < 130) {
      const items: [string, Appointment["kind"], number, string, string][] = [];
      if (daysOut > 25) items.push([`Menu tasting — ${w.title}`, "tasting", 4, "18:00", venue?.name ?? "Caterer kitchen"]);
      if (daysOut > 10) items.push([`Final dress fitting — ${w.title}`, "fitting", Math.min(9, daysOut - 5), "11:00", "Atelier"]);
      items.push([`Venue walkthrough — ${w.title}`, "venue_visit", Math.min(12, Math.max(1, daysOut - 7)), "10:00", venue?.name ?? "Venue"]);
      if (daysOut < 14) items.push([`Rehearsal — ${w.title}`, "rehearsal", daysOut - 1, "17:30", w.ceremonyType === "catholic" ? "Church" : venue?.name ?? "Venue"]);
      for (const [title, kind, inDays, time, location] of items) {
        if (inDays < 0) continue;
        const d = addDays(today, inDays);
        const start = at(d, time);
        t.appointments.push({
          id: id("apt"),
          weddingId: w.id,
          title,
          kind,
          start,
          end: new Date(new Date(start).getTime() + (kind === "rehearsal" ? 90 : 60) * 60000).toISOString(),
          location,
        });
      }
    }
  }

  return { workspace: null as never, tables: t };
}

/* ---------- emails ------------------------------------------------------------------- */

function addEmails(d: Dataset, today: Date, plan: Plan) {
  const ws = d.workspace;
  const vendorById = new Map(d.tables.vendors.map((v) => [v.id, v]));
  const ago = (hours: number) => new Date(today.getTime() - hours * 3600000).toISOString();
  let n = 0;
  const push = (e: Omit<Email, "id">) => d.tables.emails.push({ ...e, id: `eml_${(++n).toString(36)}` });

  const upcoming = d.tables.weddings
    .filter((w) => w.date && w.date >= iso(today))
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));

  for (const [wi, w] of upcoming.entries()) {
    const client = d.tables.clients.find((c) => c.id === w.clientId);
    const bookings = d.tables.bookings.filter((b) => b.weddingId === w.id);
    const pick = (cat: VendorCategory) => {
      const b = bookings.find((x) => vendorById.get(x.vendorId)?.category === cat);
      return b ? vendorById.get(b.vendorId) : undefined;
    };
    const thread = (k: string) => `thr_${w.id}_${k}`;

    const cater = pick("catering");
    if (cater) {
      push({
        threadId: thread("cat"), weddingId: w.id, vendorId: cater.id, clientId: null, direction: "in",
        fromName: cater.contactName, fromEmail: cater.email, to: ws.ownerEmail,
        subject: `Final headcount for ${w.title}`,
        body: `Hi ${ws.ownerName.split(" ")[0]},\n\nWe need the final guest count and meal selections 10 days before the event. Could you also confirm whether the kids' meals should be served with the first course?\n\nThanks,\n${cater.contactName}`,
        sentAt: ago(6 + wi * 5), read: wi > 0,
      });
    }
    const photo = pick("photography");
    if (photo) {
      push({
        threadId: thread("pho"), weddingId: w.id, vendorId: photo.id, clientId: null, direction: "out",
        fromName: ws.ownerName, fromEmail: ws.ownerEmail, to: photo.email,
        subject: `Shot list and family formals — ${w.title}`,
        body: `Hi ${photo.contactName.split(" ")[0]},\n\nAttached is the shot list. Family formals start right after the recessional. Abuela needs to be seated for hers. Please make sure the padrinos de arras are in the group shot.\n\n${ws.ownerName}`,
        sentAt: ago(30 + wi * 11), read: true,
      });
      push({
        threadId: thread("pho"), weddingId: w.id, vendorId: photo.id, clientId: null, direction: "in",
        fromName: photo.contactName, fromEmail: photo.email, to: ws.ownerEmail,
        subject: `Re: Shot list and family formals — ${w.title}`,
        body: `Got it! We'll have a second shooter on the family formals so we stay on time. Can you confirm golden hour portraits are at the end of cocktail hour?`,
        sentAt: ago(20 + wi * 9), read: wi > 1,
      });
    }
    const flor = pick("florals");
    if (flor) {
      push({
        threadId: thread("flo"), weddingId: w.id, vendorId: flor.id, clientId: null, direction: "in",
        fromName: flor.contactName, fromEmail: flor.email, to: ws.ownerEmail,
        subject: `Invoice reminder: second payment for ${w.title}`,
        body: `Hola! Just a reminder that the second payment for the floral package is due. We can't place the flower order with our grower until it's received. Gracias!`,
        sentAt: ago(50 + wi * 13), read: false,
      });
    }
    if (client && plan === "pro") {
      push({
        threadId: thread("cli"), weddingId: w.id, vendorId: null, clientId: client.id, direction: "in",
        fromName: client.partner1, fromEmail: client.email, to: ws.ownerEmail,
        subject: wi === 0 ? "Rain plan??" : "Quick question about the timeline",
        body: wi === 0
          ? `Hi! We saw the forecast shows afternoon showers. Should we move the ceremony under the terrace? What do we need to decide and by when?`
          : `Hi! Could we move the first dance before dinner so my grandparents don't miss it? Also, my mom wants to add 4 more guests. Is that ok with the venue capacity?`,
        sentAt: ago(3 + wi * 7), read: false,
      });
    }
  }

  if (plan === "pro") {
    const inquiry = d.tables.clients.find((c) => c.status === "inquiry");
    if (inquiry) {
      push({
        threadId: "thr_inquiry", weddingId: d.tables.weddings.find((w) => w.clientId === inquiry.id)?.id ?? null,
        vendorId: null, clientId: inquiry.id, direction: "in",
        fromName: inquiry.partner1, fromEmail: inquiry.email, to: ws.ownerEmail,
        subject: "Consulta: boda en Puerto Rico 2027",
        body: `¡Hola! Estamos comprometidos y buscamos una planificadora para una boda de unos 150 invitados en la playa, posiblemente en Rincón o Dorado. ¿Tienen disponibilidad para la primavera de 2027? ¿Cuáles son sus paquetes?`,
        sentAt: ago(2), read: false,
      });
    }
  }
}

/* ---------- venue quotes ------------------------------------------------------------- */

type QuoteSeed = Omit<VenueQuote, "id" | "weddingId" | "vendorId" | "venueName" | "lines" | "receivedDate" | "validUntil"> & {
  receivedDaysAgo: number;
  lines: [label: string, kind: VenueQuote["lines"][number]["kind"], amount: number, perGuest?: boolean][];
};

/**
 * Quotes for a couple still choosing a venue. Pro: the undated beach inquiry gets three
 * quotes where the cheapest sticker price (the beach club) is NOT the cheapest wedding.
 * DIY: the two quotes Ana & Luis compared before booking Monte Alto.
 */
function addVenueQuotes(d: Dataset, today: Date, plan: Plan) {
  const vendorId = (name: string) => d.tables.vendors.find((v) => v.name === name)?.id ?? null;
  const add = (weddingTitle: string, venueName: string, inDirectory: boolean, q: QuoteSeed) => {
    const w = d.tables.weddings.find((x) => x.title === weddingTitle);
    if (!w) return;
    const { receivedDaysAgo, lines, ...rest } = q;
    d.tables.venueQuotes.push({
      ...rest,
      id: id("vq"),
      weddingId: w.id,
      vendorId: inDirectory ? vendorId(venueName) : null,
      venueName,
      receivedDate: iso(addDays(today, -receivedDaysAgo)),
      validUntil: iso(addDays(today, 30 - receivedDaysAgo)),
      lines: lines.map(([label, kind, amount, perGuest = false]) => ({ id: id("ql"), label, kind, amount, perGuest })),
    });
  };

  if (plan === "pro") {
    add("Natalia & Javier", "Hacienda Las Palmas", true, {
      receivedDaysAgo: 6,
      hoursIncluded: 6, overtimePerHour: 750, fbMinimum: 20000,
      serviceChargePct: 21, taxPct: 11.5, taxOnServiceCharge: true,
      lines: [
        ["Saturday site fee", "rental", 2500],
        ["Isla package — dinner + 5-hr open bar", "food_bev", 165, true],
      ],
      items: {
        catering: "included", bar: "included", staff: "included", tables_chairs: "included", linens: "included",
        tableware: "included", cake_cutting: "included", coordinator: "included", setup_cleanup: "included",
        security: "included", lighting: "included", getting_ready: "included", rain_plan: "included",
        sound: "not_included",
      },
      gapOverrides: {},
      notes: "Covered terrace is the rain plan. Package price holds for 30 days.",
    });
    add("Natalia & Javier", "Playa Azul Beach Club", false, {
      receivedDaysAgo: 4,
      hoursIncluded: 8, overtimePerHour: null, fbMinimum: null,
      serviceChargePct: null, taxPct: 11.5, taxOnServiceCharge: false,
      lines: [
        ["Beach house rental (8 hrs)", "rental", 7500],
        ["Cleaning fee", "fee", 600],
      ],
      items: {
        getting_ready: "included", parking: "included",
        catering: "not_included", bar: "not_included", staff: "not_included", tables_chairs: "not_included",
        linens: "not_included", tableware: "not_included", cake_cutting: "not_included", coordinator: "not_included",
        setup_cleanup: "not_included", security: "not_included", lighting: "not_included", sound: "not_included",
        rain_plan: "not_included", insurance: "not_included",
      },
      gapOverrides: {},
      notes: "Bring-your-own-everything. Any licensed caterer. No indoor space — tent is on us.",
    });
    add("Natalia & Javier", "Villa Marbella Rincón", true, {
      receivedDaysAgo: 2,
      hoursIncluded: 5, overtimePerHour: 500, fbMinimum: null,
      serviceChargePct: 20, taxPct: 11.5, taxOnServiceCharge: false,
      lines: [
        ["Villa rental", "rental", 6000],
        ["In-house dinner (required caterer)", "food_bev", 95, true],
        ["Bartender fee", "fee", 400],
      ],
      items: {
        catering: "included", staff: "included", tableware: "included", linens: "included", tables_chairs: "included",
        setup_cleanup: "included", bar: "not_included", rain_plan: "not_included", security: "not_included",
        parking: "not_included", lighting: "not_included", sound: "not_included", getting_ready: "not_included",
        insurance: "not_included",
      },
      gapOverrides: { rain_plan: 4500 },
      notes: "Tent required Jun–Nov through their partner ($4,500). Lawn seats 120.",
    });
  } else {
    add("Ana & Luis", "Hacienda Monte Alto", true, {
      receivedDaysAgo: 170,
      hoursIncluded: 7, overtimePerHour: 350, fbMinimum: null,
      serviceChargePct: null, taxPct: 11.5, taxOnServiceCharge: false,
      lines: [
        ["Hacienda rental", "rental", 4800],
        ["Security (required)", "fee", 350],
      ],
      items: {
        tables_chairs: "included", coordinator: "included", rain_plan: "included", setup_cleanup: "included",
        parking: "included", getting_ready: "included", security: "included",
        catering: "not_included", bar: "not_included", staff: "not_included", linens: "not_included",
        tableware: "not_included", cake_cutting: "not_included", sound: "not_included", insurance: "not_included",
      },
      gapOverrides: {},
      notes: "Coffee barn is the rain plan. Any caterer.",
    });
    add("Ana & Luis", "Finca El Cafetal", false, {
      receivedDaysAgo: 165,
      hoursIncluded: 5, overtimePerHour: 400, fbMinimum: 14000,
      serviceChargePct: 18, taxPct: 11.5, taxOnServiceCharge: true,
      lines: [
        ["Garden ceremony + reception", "rental", 1500],
        ["All-inclusive dinner + bar", "food_bev", 118, true],
      ],
      items: {
        catering: "included", bar: "included", staff: "included", tables_chairs: "included", linens: "included",
        tableware: "included", cake_cutting: "included", coordinator: "included", setup_cleanup: "included",
        sound: "included", rain_plan: "not_included",
      },
      gapOverrides: {},
      notes: "45 minutes up the mountain from Ponce. Shuttle not included.",
    });
  }
}

/* ---------- datasets ----------------------------------------------------------------- */

function proSpecs(): WeddingSpec[] {
  const client = (
    partner1: string, partner2: string, status: ClientStatus, serviceLevel: ServiceLevel,
    planningFee: number, source: string, language: "en" | "es", notes = "",
  ): Omit<Client, "id" | "createdAt"> => ({
    partner1, partner2, status, serviceLevel, planningFee, source, language, notes,
    email: `${partner1.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${partner2.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@mail.example`,
    phone: language === "es" ? "(787) 555-0142" : "(305) 555-0187",
  });
  const wed = (
    title: string, ceremonyType: CeremonyType, city: string, guestEstimate: number, budgetTarget: number,
    style: string, extra: Partial<Wedding> = {},
  ): Omit<Wedding, "id" | "createdAt"> => ({
    title, ceremonyType, city, guestEstimate, budgetTarget, style,
    clientId: null, date: null, ceremonyTime: "17:00", venueId: null, ceremonyVenueId: null,
    destination: false, importantNotes: "", rainPlan: "", ...extra,
  });

  const PR_FULL: Partial<Record<VendorCategory, string>> = {
    venue: "Hacienda Las Palmas", catering: "Sabor Isleño Catering", photography: "Luz de Tarde Photography",
    videography: "Reel Isla Films", florals: "Flor y Canto Florals", music: "DJ Marea",
    officiant: "Padre Miguel Santana", beauty: "Glam Isla Beauty", cake: "La Dulcería Cakes",
    rentals: "Isla Event Rentals", stationery: "Papel Fino Stationery", transportation: "Caribe Shuttle & Limo",
  };

  return [
    {
      daysOut: 2,
      client: client("Camila Reyes", "Andrés Torres", "booked", "partial", 6500, "Instagram", "en",
        "Destination couple from Chicago. 60% of guests flying in. Prefer text over email."),
      wedding: wed("Camila & Andrés", "symbolic", "Dorado, PR", 110, 95000, "Modern tropical, white and green", {
        destination: true, ceremonyTime: "17:30",
        importantNotes: "Groom's father uses a wheelchair — ramp at the terrace, aisle seat row 1. Signed vendor COIs due to venue Friday.",
        rainPlan: "Move ceremony to the covered terrace; decision by 12:00 the day of.",
      }),
      vendors: { ...PR_FULL, music: "Orquesta Tropicana", officiant: undefined },
      roomBlock: { hotel: "Dorado Bay Resort", rate: 289, roomsHeld: 40, roomsBooked: 37, bookingLink: "https://hotel.example/camila-andres", cutoffDaysBefore: 30 },
    },
    {
      daysOut: 38,
      client: client("Sofía Martínez", "Diego Ortiz", "booked", "full", 9800, "Referral — Hacienda Las Palmas", "es",
        "Mother of the bride (Carmen) is the main decision-maker on décor. Copy her on design emails."),
      wedding: wed("Sofía & Diego", "catholic", "San Juan, PR", 160, 68000, "Colonial romance, ivory and terracotta", {
        ceremonyTime: "16:00",
        importantNotes: "Catholic ceremony at the parish, reception at Casa Coralina. Pre-Cana certificate still missing. Arras and lazo in the ceremony.",
        rainPlan: "Courtyard tent is already contracted. No change needed.",
      }),
      vendors: { ...PR_FULL, venue: "Casa Coralina Old San Juan" },
      stageOverrides: { transportation: "quoted" },
    },
    {
      daysOut: 118,
      client: client("Emily Carter", "James Whitfield", "booked", "full", 14000, "The Knot", "en",
        "Interfaith (Jewish + Episcopal). Ketubah signing before the ceremony."),
      wedding: wed("Emily & James", "interfaith", "Miami, FL", 140, 120000, "Black tie on the bay", {
        ceremonyTime: "18:00",
        importantNotes: "Chuppah build needs a 3-hour setup window. Hora during the reception. Venue noise curfew is 11pm.",
        rainPlan: "Ballroom flip. The venue needs 90 minutes, so the call must be made by 2pm.",
      }),
      vendors: {
        venue: "The Bayfront Estate", catering: "Coastal Table Co.", photography: "Hartwell Studio",
        florals: "Petal & Palm", music: "DJ Marea", officiant: "Rev. Linda Moore", beauty: "Glam Isla Beauty",
        rentals: "Isla Event Rentals", stationery: "Papel Fino Stationery",
      },
      englishGuests: true,
    },
    {
      daysOut: 205,
      client: client("Valeria Santos", "Marco Russo", "booked", "day_of", 3200, "Google", "en",
        "Day-of coordination only. The couple booked their own vendors. Our job starts 6 weeks out."),
      wedding: wed("Valeria & Marco", "symbolic", "Rincón, PR", 80, 42000, "Barefoot sunset", {
        destination: true, ceremonyTime: "17:45",
        importantNotes: "Sunset is around 18:55. Ceremony timing is built around it.",
        rainPlan: "Tent on hold with Isla Event Rentals. Confirm 30 days out.",
      }),
      vendors: { venue: "Villa Marbella Rincón", photography: "Luz de Tarde Photography", music: "DJ Marea", florals: "Flor y Canto Florals", catering: "Sabor Isleño Catering" },
      roomBlock: { hotel: "Villa Marbella casitas", rate: 245, roomsHeld: 18, roomsBooked: 9, bookingLink: "https://hotel.example/valeria-marco", cutoffDaysBefore: 45 },
    },
    {
      daysOut: 300,
      client: client("Isabel Nieves", "Gabriel Colón", "booked", "full", 8500, "Bridal expo — San Juan", "es"),
      wedding: wed("Isabel & Gabriel", "catholic", "Ponce, PR", 220, 75000, "Hacienda classic, live salsa", {
        ceremonyTime: "15:30",
        importantNotes: "220 guests. The orchestra needs a stage and dedicated power.",
      }),
      vendors: { ...PR_FULL, venue: "Hacienda Monte Alto", music: "Orquesta Tropicana" },
    },
    {
      daysOut: 400,
      client: client("Lauren Kim", "Daniel Park", "proposal", "partial", 5800, "Website form", "en",
        "Proposal sent. Follow up next week. They're also talking to two other planners."),
      wedding: wed("Lauren & Daniel", "civil", "St. Augustine, FL", 120, 60000, "Garden party", {
        ceremonyTime: "16:30",
      }),
      vendors: { venue: "Magnolia House St. Augustine" },
      englishGuests: true,
    },
    {
      daysOut: Infinity,
      client: client("Natalia Ruiz", "Javier Medina", "inquiry", "full", 9000, "Instagram DM", "es",
        "Beach wedding, about 150 guests, spring 2027. Prefers Spanish."),
      wedding: wed("Natalia & Javier", "catholic", "Rincón or Dorado, PR", 150, 70000, "Beach"),
      vendors: {},
    },
    {
      daysOut: -24,
      client: client("Olivia Brooks", "Ethan Hayes", "completed", "full", 11000, "Referral", "en",
        "Sent the thank-you gift. Ask for a review and their photos for the portfolio."),
      wedding: wed("Olivia & Ethan", "christian", "Miami, FL", 130, 88000, "Coastal chic", { ceremonyTime: "17:00" }),
      vendors: {
        venue: "The Bayfront Estate", catering: "Coastal Table Co.", photography: "Hartwell Studio",
        florals: "Petal & Palm", music: "DJ Marea", officiant: "Rev. Linda Moore",
      },
      englishGuests: true,
    },
  ];
}

function diySpecs(): WeddingSpec[] {
  return [
    {
      daysOut: 236,
      wedding: {
        title: "Ana & Luis",
        clientId: null,
        date: null,
        ceremonyTime: "16:00",
        venueId: null,
        ceremonyVenueId: null,
        city: "Ponce, PR",
        guestEstimate: 130,
        budgetTarget: 38000,
        ceremonyType: "catholic",
        destination: false,
        style: "Hacienda rustic, coffee and gold",
        importantNotes: "Church at 4pm, then the hacienda. Abuela Gloria needs a seat close to the front with shade.",
        rainPlan: "The coffee barn at the hacienda holds everyone.",
      },
      vendors: {
        venue: "Hacienda Monte Alto", catering: "Sabor Isleño Catering", photography: "Luz de Tarde Photography",
        videography: "Reel Isla Films", florals: "Flor y Canto Florals", music: "DJ Marea",
        officiant: "Parroquia San Antonio (Ponce)", beauty: "Glam Isla Beauty", cake: "La Dulcería Cakes",
        stationery: "Papel Fino Stationery",
      },
      stageOverrides: { venue: "booked", photography: "booked", catering: "booked", officiant: "booked", videography: "quoted", florals: "contacted", music: "quoted" },
    },
  ];
}

export function seedDataset(plan: Plan, today: Date): Dataset {
  const rand = prng(20261007);
  const d =
    plan === "pro"
      ? build("pro", proSpecs(), PRO_VENDORS, today, rand)
      : build("diy", diySpecs(), DIY_VENDORS, today, rand);
  d.workspace =
    plan === "pro"
      ? { plan, name: "Brisa Wedding Co.", ownerName: "Marisol Vega", ownerEmail: "marisol@brisaweddings.example", city: "San Juan, PR" }
      : { plan, name: "Ana & Luis", ownerName: "Ana Rodríguez", ownerEmail: "ana.luis@mail.example", city: "Ponce, PR" };
  addEmails(d, today, plan);
  addVenueQuotes(d, today, plan);
  return d;
}
