import { expect, test } from "bun:test";

import { seedDataset } from "./seed";
import { migrateDemoDataset, resolveStoredDataset } from "./store";
import type { Dataset, PortalShare } from "./types";

const workspace = {
  plan: "pro" as const,
  name: "Brisa",
  ownerName: "Marisol",
  ownerEmail: "m@example.com",
  city: "San Juan",
};

test("a saved demo gains blank service-charge fields and keeps a legacy flat fee", () => {
  const legacy = {
    tables: {
      clients: [{ planningFee: 4000 }],
      budgetLines: [{ description: "Venue rental", estimate: 9000 }],
    },
  } as unknown as Dataset;

  const next = migrateDemoDataset(legacy);
  expect(next.changed).toBe(true);
  expect(next.data.tables.clients[0]?.feeModel).toBe("flat");
  expect(next.data.tables.clients[0]?.feeFlat).toBe(4000);
  expect(next.data.tables.clients[0]?.feePercent).toBeNull();
  expect(next.data.tables.budgetLines[0]?.serviceChargePct).toBeNull();
  expect(next.data.tables.budgetLines[0]?.taxPct).toBeNull();
  expect(next.data.tables.budgetLines[0]?.subEventId).toBeNull();
  expect(next.data.tables.subEvents).toEqual([]);
  expect(next.data.tables.gratuities).toEqual([]);
  expect(next.data.tables.portalShares).toEqual([]);
  expect("planningFee" in (next.data.tables.clients[0] as object)).toBe(false);

  const again = migrateDemoDataset(next.data);
  expect(again.changed).toBe(false);
  expect(again.data).toBe(next.data);
  expect(again.data.tables.budgetLines[0]?.serviceChargePct).toBeNull();
  expect(again.data.tables.clients[0]?.feeFlat).toBe(4000);
});

test("a saved demo gains an empty sub-event list and blank links", () => {
  const legacy = {
    tables: {
      clients: [{ feeModel: "flat", feeFlat: 1000, feePercent: null, feeHours: null, feeRate: null }],
      budgetLines: [{ description: "Venue rental", serviceChargePct: 18, taxPct: 11.5 }],
      bookings: [{ vendorId: "v", arrivalTime: "15:00" }],
      timeline: [{ title: "Ceremony", segment: "ceremony" }],
      gratuities: [{ id: "gra_1", cash: true, handedBy: "planner" }],
    },
  } as unknown as Dataset;

  const next = migrateDemoDataset(legacy);
  expect(next.changed).toBe(true);
  expect(next.data.tables.subEvents).toEqual([]);
  expect(next.data.tables.budgetLines[0]?.subEventId).toBeNull();
  expect(next.data.tables.bookings[0]?.subEventId).toBeNull();
  expect(next.data.tables.timeline[0]?.subEventId).toBeNull();
  expect(next.data.tables.budgetLines[0]?.serviceChargePct).toBe(18);
  expect(next.data.tables.budgetLines[0]?.taxPct).toBe(11.5);
  expect(next.data.tables.gratuities).toEqual([{ id: "gra_1", cash: true, handedBy: "planner" }]);
  expect(next.data.tables.portalShares).toEqual([]);

  const again = migrateDemoDataset(next.data);
  expect(again.changed).toBe(false);
  expect(again.data).toBe(next.data);
  expect(again.data.tables.subEvents).toEqual([]);
  expect(again.data.tables.budgetLines[0]?.subEventId).toBeNull();
});

function legacyDataset(): Dataset {
  const seeded = seedDataset("pro", new Date(2026, 10, 26));
  const tables = { ...seeded.tables };
  delete (tables as { portalShares?: PortalShare[] }).portalShares;
  return { workspace: seeded.workspace, tables };
}

test("a version 4 save gains an empty couple-view list and keeps its rows", () => {
  const seeded = seedDataset("pro", new Date(2026, 10, 26));
  const legacy = legacyDataset();
  const migrated = migrateDemoDataset(legacy);

  expect(migrated.changed).toBe(true);
  expect(migrated.data.tables.portalShares).toEqual([]);
  expect(migrated.data.tables.weddings.map((w) => w.title)).toEqual(seeded.tables.weddings.map((w) => w.title));
  expect(migrated.data.tables.budgetLines[0]).toEqual(seeded.tables.budgetLines[0]);
  expect(migrated.data.tables.clients[0]?.notes).toBe(seeded.tables.clients[0]?.notes);
  expect(migrated.data.tables.gratuities).toEqual(seeded.tables.gratuities);
  expect(migrated.data.tables.subEvents).toEqual(seeded.tables.subEvents);

  const again = migrateDemoDataset(migrated.data);
  expect(again.changed).toBe(false);
  expect(again.data).toBe(migrated.data);
});

test("a junk module name is dropped and a share for a deleted wedding is removed", () => {
  const seeded = seedDataset("diy", new Date(2026, 10, 26));
  const weddingId = seeded.tables.weddings[0]!.id;
  seeded.tables.portalShares = [
    {
      id: "por_keep",
      weddingId,
      token: `demo-diy-${weddingId}`,
      enabled: true,
      visible: ["timeline", "not-a-module" as "timeline"],
    },
    {
      id: "por_gone",
      weddingId: "wed_deleted",
      token: "demo-diy-wed_deleted",
      enabled: true,
      visible: ["guests"],
    },
  ];

  const migrated = migrateDemoDataset(seeded);
  expect(migrated.changed).toBe(true);
  expect(migrated.data.tables.portalShares).toEqual([
    {
      id: "por_keep",
      weddingId,
      token: `demo-diy-${weddingId}`,
      enabled: true,
      visible: ["timeline"],
    },
  ]);

  const again = migrateDemoDataset(migrated.data);
  expect(again.changed).toBe(false);
  expect(again.data.tables.portalShares).toEqual(migrated.data.tables.portalShares);
});

test("tips, fee terms, tax, sub-events, and a couple-view share survive together", () => {
  const raw = {
    workspace,
    tables: {
      weddings: [{ id: "wed_1", title: "Camila & Andrés" }],
      clients: [{ planningFee: 4200, notes: "keep the note" }],
      budgetLines: [{ description: "Venue rental", estimate: 9000, serviceChargePct: 20, taxPct: 11.5 }],
      gratuities: [{ id: "gra_1", weddingId: "wed_1", bookingId: "bkg_1", budgetLineId: "bl_1", cash: true, handedBy: "planner" }],
      subEvents: [{ id: "sub_1", weddingId: "wed_1", kind: "ceremony" }],
      bookings: [{ id: "bkg_1", subEventId: "sub_1" }],
      timeline: [{ id: "tml_1", subEventId: null }],
      portalShares: [{
        id: "por_1",
        weddingId: "wed_1",
        token: "demo-pro-wed_1",
        enabled: false,
        visible: ["budget", "not-real"],
      }],
    },
  } as unknown as Dataset;

  const migrated = migrateDemoDataset(raw);
  expect(migrated.changed).toBe(true);
  expect(migrated.data.tables.clients[0]?.feeModel).toBe("flat");
  expect(migrated.data.tables.clients[0]?.feeFlat).toBe(4200);
  expect(migrated.data.tables.clients[0]?.notes).toBe("keep the note");
  expect(migrated.data.tables.budgetLines[0]?.estimate).toBe(9000);
  expect(migrated.data.tables.budgetLines[0]?.serviceChargePct).toBe(20);
  expect(migrated.data.tables.budgetLines[0]?.taxPct).toBe(11.5);
  expect(migrated.data.tables.budgetLines[0]?.subEventId).toBeNull();
  expect(migrated.data.tables.gratuities).toEqual(raw.tables.gratuities);
  expect(migrated.data.tables.subEvents).toEqual([{ id: "sub_1", weddingId: "wed_1", kind: "ceremony" }]);
  expect(migrated.data.tables.bookings[0]?.subEventId).toBe("sub_1");
  expect(migrated.data.tables.timeline[0]?.subEventId).toBeNull();
  expect(migrated.data.tables.portalShares).toEqual([
    {
      id: "por_1",
      weddingId: "wed_1",
      token: "demo-pro-wed_1",
      enabled: false,
      visible: ["budget"],
    },
  ]);

  const again = migrateDemoDataset(migrated.data);
  expect(again.changed).toBe(false);
  expect(again.data).toBe(migrated.data);
});

test("storage prefers the newest readable save and migrates every older version", () => {
  const now = new Date(2026, 10, 26);
  const seeded = seedDataset("pro", now);
  const current = resolveStoredDataset({ 9: JSON.stringify(seeded), 4: "{}" }, "pro", now);
  expect(current.persist).toBe(false);
  expect(current.data.tables.weddings).toHaveLength(seeded.tables.weddings.length);

  const v4 = {
    workspace,
    tables: {
      weddings: [{ id: "wed_old", title: "From v4" }],
      clients: [{ planningFee: 1500, notes: "keep me" }],
      budgetLines: [{ description: "Flowers", estimate: 800 }],
      bookings: [{ vendorId: "ven_1" }],
      timeline: [{ title: "First look" }],
    },
  };
  const fromV4 = resolveStoredDataset({ 9: "not json", 8: "null", 5: "", 4: JSON.stringify(v4) }, "pro", now);
  expect(fromV4.persist).toBe(true);
  expect(fromV4.data.tables.weddings[0]?.title).toBe("From v4");
  expect(fromV4.data.tables.clients[0]?.feeModel).toBe("flat");
  expect(fromV4.data.tables.clients[0]?.feeFlat).toBe(1500);
  expect(fromV4.data.tables.clients[0]?.notes).toBe("keep me");
  expect(fromV4.data.tables.budgetLines[0]?.estimate).toBe(800);
  expect(fromV4.data.tables.budgetLines[0]?.serviceChargePct).toBeNull();
  expect(fromV4.data.tables.budgetLines[0]?.taxPct).toBeNull();
  expect(fromV4.data.tables.budgetLines[0]?.subEventId).toBeNull();
  expect(fromV4.data.tables.subEvents).toEqual([]);
  expect(fromV4.data.tables.gratuities).toEqual([]);
  expect(fromV4.data.tables.bookings[0]?.subEventId).toBeNull();
  expect(fromV4.data.tables.timeline[0]?.subEventId).toBeNull();
  expect(fromV4.data.tables.portalShares).toEqual([]);

  const v6 = {
    workspace,
    tables: {
      weddings: [{ id: "wed_6", title: "From v6" }],
      clients: [{ feeModel: "hourly", feeFlat: null, feePercent: null, feeHours: 20, feeRate: 150 }],
      gratuities: [{ id: "gra_1", cash: true }],
      budgetLines: [{ estimate: 100, serviceChargePct: 18, taxPct: null }],
    },
  };
  const fromV6 = resolveStoredDataset({ 6: JSON.stringify(v6), 4: JSON.stringify(v4) }, "pro", now);
  expect(fromV6.persist).toBe(true);
  expect(fromV6.data.tables.weddings[0]?.title).toBe("From v6");
  expect(fromV6.data.tables.clients[0]?.feeModel).toBe("hourly");
  expect(fromV6.data.tables.clients[0]?.feeHours).toBe(20);
  expect(fromV6.data.tables.gratuities).toEqual([{ id: "gra_1", cash: true }]);
  expect(fromV6.data.tables.budgetLines[0]?.serviceChargePct).toBe(18);
  expect(fromV6.data.tables.budgetLines[0]?.taxPct).toBeNull();
  expect(fromV6.data.tables.budgetLines[0]?.subEventId).toBeNull();
  expect(fromV6.data.tables.subEvents).toEqual([]);
  expect(fromV6.data.tables.portalShares).toEqual([]);

  const v8 = {
    workspace,
    tables: {
      weddings: [{ id: "wed_8", title: "From v8" }],
      subEvents: [{ id: "sub_welcome", weddingId: "wed_8", kind: "welcome" }],
      budgetLines: [{ estimate: 50, serviceChargePct: null, taxPct: 7, subEventId: "sub_welcome" }],
      bookings: [{ subEventId: "sub_welcome" }],
      timeline: [{ subEventId: "sub_welcome" }],
      gratuities: [{ id: "gra_8", cash: false, handedBy: "couple" }],
      clients: [{ feeModel: "percent", feeFlat: null, feePercent: 10, feeHours: null, feeRate: null }],
    },
  };
  const fromV8 = resolveStoredDataset({ 8: JSON.stringify(v8), 4: JSON.stringify(v4) }, "pro", now);
  expect(fromV8.persist).toBe(true);
  expect(fromV8.data.tables.weddings[0]?.title).toBe("From v8");
  expect(fromV8.data.tables.subEvents[0]?.kind).toBe("welcome");
  expect(fromV8.data.tables.budgetLines[0]?.taxPct).toBe(7);
  expect(fromV8.data.tables.budgetLines[0]?.serviceChargePct).toBeNull();
  expect(fromV8.data.tables.budgetLines[0]?.subEventId).toBe("sub_welcome");
  expect(fromV8.data.tables.bookings[0]?.subEventId).toBe("sub_welcome");
  expect(fromV8.data.tables.timeline[0]?.subEventId).toBe("sub_welcome");
  expect(fromV8.data.tables.gratuities[0]?.handedBy).toBe("couple");
  expect(fromV8.data.tables.clients[0]?.feeModel).toBe("percent");
  expect(fromV8.data.tables.clients[0]?.feePercent).toBe(10);
  expect(fromV8.data.tables.portalShares).toEqual([]);

  const v5Portal = {
    workspace: { ...workspace, plan: "diy" as const },
    tables: {
      weddings: [{ id: "wed_diy", title: "Ana & Luis" }],
      clients: [{ planningFee: 0 }],
      budgetLines: [{ estimate: 500 }],
      portalShares: [{
        id: "por_diy",
        weddingId: "wed_diy",
        token: "demo-diy-wed_diy",
        enabled: true,
        visible: ["guests", "timeline"],
      }],
    },
  };
  const fromPortal = resolveStoredDataset({ 5: JSON.stringify(v5Portal), 4: JSON.stringify(v4) }, "diy", now);
  expect(fromPortal.persist).toBe(true);
  expect(fromPortal.data.tables.weddings[0]?.title).toBe("Ana & Luis");
  expect(fromPortal.data.tables.clients[0]?.feeModel).toBe("flat");
  expect(fromPortal.data.tables.clients[0]?.feeFlat).toBe(0);
  expect(fromPortal.data.tables.portalShares[0]?.visible).toEqual(["timeline", "guests"]);
  expect(fromPortal.data.tables.portalShares[0]?.enabled).toBe(true);
  expect(fromPortal.data.tables.budgetLines[0]?.estimate).toBe(500);
  expect(fromPortal.data.tables.budgetLines[0]?.taxPct).toBeNull();
  expect(fromPortal.data.tables.gratuities).toEqual([]);
  expect(fromPortal.data.tables.subEvents).toEqual([]);

  const fresh = resolveStoredDataset({}, "diy", now);
  expect(fresh.persist).toBe(true);
  expect(fresh.data.workspace.plan).toBe("diy");
  expect(Array.isArray(fresh.data.tables.portalShares)).toBe(true);
  expect(Array.isArray(fresh.data.tables.gratuities)).toBe(true);
  expect(Array.isArray(fresh.data.tables.subEvents)).toBe(true);
});
