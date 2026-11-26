import { expect, test } from "bun:test";

import { seedDataset } from "~/data/seed";
import type { Booking, BudgetLine, Client, DocumentRecord, Email, Guest, Payment, PortalShare, Task, Vendor, Wedding } from "~/data/types";

import { defaultPortalShare, projectCouplePortal, resolvePortalShare, type PortalSource } from "./portal";

const TODAY = "2026-11-26";

function wedding(patch: Partial<Wedding> = {}): Wedding {
  return {
    id: "wed_1",
    clientId: "cli_1",
    title: "Camila & Andrés",
    date: "2026-12-01",
    ceremonyTime: "17:30",
    venueId: "ven_1",
    ceremonyVenueId: null,
    city: "Dorado, PR",
    guestEstimate: 110,
    budgetTarget: 95000,
    ceremonyType: "symbolic",
    destination: true,
    style: "Modern tropical",
    importantNotes: "NOTE_IMPORTANT wheelchair ramp",
    rainPlan: "Move ceremony to the covered terrace",
    createdAt: "2026-01-01",
    ...patch,
  };
}

function source(patch: Partial<PortalSource> = {}): PortalSource {
  const share = defaultPortalShare("wed_1", "pro");
  return {
    share,
    wedding: wedding(),
    workspaceName: "Brisa Wedding Co.",
    vendors: [
      {
        id: "ven_1",
        name: "Hacienda Las Palmas",
        category: "venue",
        contactName: "Rosa Méndez",
        email: "rosa@venue.example",
        phone: "(787) 555-0101",
        city: "Dorado, PR",
        instagram: "@hacienda",
        preferred: true,
        notes: "NOTE_VENDOR generator on site",
        address: "Carr. 693 Km 8.2, Dorado, PR",
      },
      {
        id: "ven_2",
        name: "Pipeline Florist",
        category: "florals",
        contactName: "Nia",
        email: "nia@flowers.example",
        phone: "(787) 555-0199",
        city: "Dorado, PR",
        instagram: "",
        preferred: false,
        notes: "NOTE_VENDOR still sourcing",
      },
    ],
    bookings: [
      booking("bkg_1", "ven_1", "booked"),
      booking("bkg_2", "ven_2", "researching"),
    ],
    timeline: [
      {
        id: "tml_1",
        weddingId: "wed_1",
        time: "17:30",
        durationMin: 35,
        title: "Ceremony",
        segment: "ceremony",
        location: "Lawn",
        owner: "Officiant",
        notes: "NOTE_CUE quiet the DJ",
      },
    ],
    tasks: [
      task("tsk_couple", "Set the budget", "couple"),
      task("tsk_planner", "PLANNER_TASK book the venue", "planner"),
    ],
    documents: [
      doc("doc_contract", "contract", "Planning agreement", ""),
      doc("doc_ins", "insurance", "INSURANCE_DOC liability", "NOTE_DOCUMENT additional insured"),
    ],
    budgetLines: [
      line("bl_1", "wed_1", 10000, "SECRET_LINE_DESC"),
      line("bl_other", "wed_9", 999999, "OTHER_WEDDING_LINE"),
    ],
    payments: [
      payment("pay_out", "outgoing", 2000, "2026-11-01", null),
      payment("pay_in", "incoming", 5000, "2026-10-01", "2026-10-01"),
      payment("pay_other", "outgoing", 8000, "2026-11-01", null, "wed_9"),
    ],
    guests: [
      guest("gst_1", "wed_1", "Camila", "GUEST_EMAIL_SECRET@mail.example"),
      guest("gst_9", "wed_9", "OTHER_WEDDING_GUEST", "other@mail.example"),
    ],
    today: TODAY,
    clients: [client()],
    emails: [email()],
    ...patch,
  };
}

function booking(id: string, vendorId: string, stage: Booking["stage"]): Booking {
  return { id, weddingId: "wed_1", vendorId, stage, amount: 1000, arrivalTime: "15:00", notes: "NOTE_BOOKING load-in" };
}

function task(id: string, title: string, owner: Task["owner"]): Task {
  return { id, weddingId: "wed_1", title, dueDate: "2026-11-01", done: false, owner, phase: "Week of" };
}

function doc(id: string, kind: DocumentRecord["kind"], title: string, notes: string): DocumentRecord {
  return {
    id,
    weddingId: "wed_1",
    vendorId: null,
    clientId: "cli_1",
    kind,
    title,
    status: "signed",
    amount: 100,
    updatedAt: "2026-11-01",
    url: "https://drive.example.com/file",
    notes,
  };
}

function line(id: string, weddingId: string, estimate: number, description: string): BudgetLine {
  return { id, weddingId, category: "Venue & catering", description, estimate, actual: null, bookingId: null, paidBy: "couple" };
}

function payment(
  id: string,
  direction: Payment["direction"],
  amount: number,
  dueDate: string,
  paidDate: string | null,
  weddingId = "wed_1",
): Payment {
  return { id, weddingId, direction, bookingId: null, label: id, amount, dueDate, paidDate, method: "Card" };
}

function guest(id: string, weddingId: string, firstName: string, email: string): Guest {
  return {
    id,
    weddingId,
    household: "The Reyes family",
    firstName,
    lastName: "Reyes",
    side: "partner1",
    list: "B",
    rsvp: "attending",
    meal: "fish",
    dietary: "",
    isPlusOne: false,
    isChild: false,
    role: "",
    table: 1,
    email,
  };
}

function client(): Client {
  return {
    id: "cli_1",
    partner1: "Camila",
    partner2: "Andrés",
    email: "camila@mail.example",
    phone: "(787) 555-0100",
    status: "booked",
    serviceLevel: "partial",
    planningFee: 6500,
    source: "Instagram",
    language: "en",
    notes: "NOTE_CLIENT talking to two other planners",
    createdAt: "2026-01-01",
  };
}

function email(): Email {
  return {
    id: "eml_1",
    threadId: "thr_1",
    weddingId: "wed_1",
    vendorId: null,
    clientId: "cli_1",
    direction: "in",
    fromName: "Rosa",
    fromEmail: "rosa@venue.example",
    to: "marisol@brisaweddings.example",
    subject: "NOTE_EMAIL subject",
    body: "NOTE_EMAIL body about the COI",
    sentAt: "2026-11-01T12:00:00.000Z",
    read: false,
  };
}

const HIDDEN = [
  "NOTE_IMPORTANT",
  "NOTE_VENDOR",
  "NOTE_BOOKING",
  "NOTE_DOCUMENT",
  "NOTE_CLIENT",
  "NOTE_EMAIL",
  "NOTE_CUE",
  "GUEST_EMAIL_SECRET",
  "OTHER_WEDDING_GUEST",
  "OTHER_WEDDING_LINE",
  "INSURANCE_DOC",
  "PLANNER_TASK",
  "SECRET_LINE_DESC",
  "Pipeline Florist",
  "rosa@venue.example",
  "@hacienda",
];

test("the couple view drops internal notes, other weddings, and hidden files", () => {
  const view = projectCouplePortal(source());
  expect(view.closed).toBe(false);
  if (view.closed) return;
  const blob = JSON.stringify(view);
  for (const secret of HIDDEN) expect(blob).not.toContain(secret);

  expect(view.title).toBe("Camila & Andrés");
  expect(view.rainPlan).toContain("covered terrace");
  expect(view.venueAddress).toContain("Carr. 693");
  expect(view.tasks?.map((t) => t.title)).toEqual(["Set the budget"]);
  expect(view.files?.map((f) => f.title)).toEqual(["Planning agreement"]);
  expect(view.vendors?.map((v) => v.name)).toEqual(["Hacienda Las Palmas"]);
  expect(view.guests?.rows).toHaveLength(1);
  expect(view.guests?.rows[0]?.name).toBe("Camila Reyes");
  expect(JSON.stringify(view.guests)).not.toContain("list");
  expect(view.budget?.projected).toBe(10000);
  expect(view.budget?.remaining).toBe(85000);
  expect(view.payments?.outgoing.totals.outstanding).toBe(2000);
  expect(view.payments?.outgoing.totals.paid).toBe(0);
  expect(view.payments?.incoming.totals.paid).toBe(5000);
  expect(view.payments?.incoming.totals.outstanding).toBe(0);
});

test("a hidden module is absent, and a turned-off view reveals nothing", () => {
  const share: PortalShare = { ...defaultPortalShare("wed_1", "pro"), visible: ["budget"] };
  const budgetOnly = projectCouplePortal(source({ share }));
  expect(budgetOnly.closed).toBe(false);
  if (!budgetOnly.closed) {
    expect(budgetOnly.budget?.projected).toBe(10000);
    expect(budgetOnly.tasks).toBeUndefined();
    expect(budgetOnly.payments).toBeUndefined();
    expect(budgetOnly.guests).toBeUndefined();
    expect(budgetOnly.timeline).toBeUndefined();
  }

  const off = projectCouplePortal(source({ share: { ...share, enabled: false } }));
  expect(off).toEqual({ closed: true, reason: "off" });
  expect(JSON.stringify(off)).not.toContain("Camila");
  expect(JSON.stringify(off)).not.toContain("NOTE_");
});

test("a wedding with no budget lines stays blank instead of $0", () => {
  const view = projectCouplePortal(source({ budgetLines: [], wedding: wedding({ budgetTarget: 70000 }) }));
  expect(view.closed).toBe(false);
  if (view.closed) return;
  expect(view.budget?.target).toBe(70000);
  expect(view.budget?.projected).toBeNull();
  expect(view.budget?.remaining).toBeNull();
  expect(view.budget?.overBudget).toBe(false);
});

test("a demo token resolves only inside the plan that owns the wedding", () => {
  const weddings = [wedding()];
  const token = defaultPortalShare("wed_1", "pro").token;
  expect(resolvePortalShare([], weddings, token, "pro")?.weddingId).toBe("wed_1");
  expect(resolvePortalShare([], weddings, token, "diy")).toBeNull();
  expect(resolvePortalShare([], weddings, "demo-pro-missing", "pro")).toBeNull();

  const disabled: PortalShare = { ...defaultPortalShare("wed_1", "pro"), enabled: false, visible: [] };
  expect(resolvePortalShare([disabled], weddings, token, "pro")?.enabled).toBe(false);
});

test("a seeded wedding keeps the rain plan and hides planner notes", () => {
  const now = new Date(2026, 10, 26);
  const data = seedDataset("pro", now);
  const weddingRow = data.tables.weddings.find((w) => w.title === "Camila & Andrés");
  expect(weddingRow).toBeTruthy();
  if (!weddingRow) return;
  const share = defaultPortalShare(weddingRow.id, "pro");
  const view = projectCouplePortal({
    share,
    wedding: weddingRow,
    workspaceName: data.workspace.name,
    vendors: data.tables.vendors,
    bookings: data.tables.bookings,
    timeline: data.tables.timeline,
    tasks: data.tables.tasks,
    documents: data.tables.documents,
    budgetLines: data.tables.budgetLines,
    payments: data.tables.payments,
    guests: data.tables.guests,
    clients: data.tables.clients,
    emails: data.tables.emails,
    today: "2026-11-26",
  });
  expect(view.closed).toBe(false);
  if (view.closed) return;
  const blob = JSON.stringify(view);
  expect(view.rainPlan).toContain("covered terrace");
  expect(blob).not.toContain("wheelchair");
  expect(blob).not.toContain("Generator on site");
  expect(blob).not.toContain("Destination couple from Chicago");
  expect(blob).not.toContain("medical certificate");
  expect(blob).not.toContain("additional insured");
  expect(blob).not.toContain("Event liability insurance");
  expect(blob).not.toContain("@mail.example");
  expect(blob).not.toContain("Book the venue");
  expect(blob).toContain("Marriage license packet");
  expect(blob).toContain("Last dance");
  expect(blob).not.toContain("Vendor breakdown");
  expect(blob).not.toContain("load-out");
  expect(view.tasks?.some((t) => t.title === "Set the budget and top three priorities")).toBe(true);
  expect(data.tables.portalShares).toEqual([]);
});
