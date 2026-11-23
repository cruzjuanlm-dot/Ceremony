import { expect, test } from "bun:test";

import { seedDataset } from "./seed";

const today = new Date("2026-11-23T15:00:00Z");

test("seeded weddings get sub-events only where the day is already described", () => {
  const pro = seedDataset("pro", today);
  const camila = pro.tables.weddings.find((w) => w.title === "Camila & Andrés");
  const natalia = pro.tables.weddings.find((w) => w.title === "Natalia & Javier");
  const lauren = pro.tables.weddings.find((w) => w.title === "Lauren & Daniel");
  if (!camila || !natalia || !lauren) throw new Error("missing seeded wedding");

  const camilaEvents = pro.tables.subEvents.filter((e) => e.weddingId === camila.id);
  expect(camilaEvents.map((e) => e.kind)).toEqual(["ceremony", "cocktail", "reception", "after_party"]);
  expect(camilaEvents.find((e) => e.kind === "ceremony")).toMatchObject({
    time: "17:30",
    location: "Hacienda Las Palmas",
  });
  expect(camilaEvents.find((e) => e.kind === "cocktail")?.time).toBe("18:15");
  expect(camilaEvents.find((e) => e.kind === "reception")?.time).toBe("19:15");
  expect(camilaEvents.find((e) => e.kind === "after_party")?.time).toBe("23:00");
  expect(camilaEvents.some((e) => e.kind === "welcome" || e.kind === "brunch" || e.kind === "rehearsal")).toBe(false);

  expect(pro.tables.subEvents.filter((e) => e.weddingId === natalia.id)).toEqual([]);

  const laurenEvents = pro.tables.subEvents.filter((e) => e.weddingId === lauren.id);
  expect(laurenEvents.map((e) => e.kind)).toEqual(["ceremony", "cocktail", "reception"]);
  expect(laurenEvents.find((e) => e.kind === "cocktail")?.time).toBeNull();
  expect(laurenEvents.find((e) => e.kind === "reception")?.location).toBe("Magnolia House St. Augustine");

  const sofia = pro.tables.weddings.find((w) => w.title === "Sofía & Diego");
  if (!sofia) throw new Error("missing Sofía");
  expect(pro.tables.subEvents.find((e) => e.weddingId === sofia.id && e.kind === "ceremony")?.location).toBe("Parish");

  const receptionId = camilaEvents.find((e) => e.kind === "reception")?.id;
  const ceremonyId = camilaEvents.find((e) => e.kind === "ceremony")?.id;
  const catering = pro.tables.budgetLines.find((l) => l.weddingId === camila.id && l.description === "Catering & bar");
  const photo = pro.tables.budgetLines.find((l) => l.weddingId === camila.id && l.description === "Photography");
  const ceremonyLine = pro.tables.budgetLines.find((l) => l.weddingId === camila.id && l.category === "Ceremony");
  expect(catering?.subEventId).toBe(receptionId);
  expect(photo?.subEventId).toBeNull();
  expect(ceremonyLine?.subEventId).toBe(ceremonyId);

  const cocktailCue = pro.tables.timeline.find((t) => t.weddingId === camila.id && t.segment === "cocktail");
  expect(cocktailCue?.subEventId).toBe(camilaEvents.find((e) => e.kind === "cocktail")?.id);

  const diy = seedDataset("diy", today);
  const ana = diy.tables.weddings[0];
  if (!ana) throw new Error("missing DIY wedding");
  const anaEvents = diy.tables.subEvents.filter((e) => e.weddingId === ana.id);
  expect(anaEvents.map((e) => e.kind)).toEqual(["ceremony", "cocktail", "reception"]);
  expect(anaEvents.find((e) => e.kind === "ceremony")).toMatchObject({ location: "Parish", time: "16:00" });
  expect(anaEvents.find((e) => e.kind === "cocktail")?.time).toBeNull();
});
