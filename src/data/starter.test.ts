import { expect, test } from "bun:test";

import { BUDGET_CATEGORIES } from "../components/wedding/wedding-helpers";
import { starterBudgetLines, starterTasks, starterTimeline, STARTER_BUDGET } from "./starter";

test("starter budget shares are the research table and land on the app's categories", () => {
  expect(STARTER_BUDGET.reduce((sum, row) => sum + row.shareBps, 0)).toBe(10000);
  for (const row of STARTER_BUDGET) expect(BUDGET_CATEGORIES).toContain(row.category);

  const lines = starterBudgetLines(40000, "pro");
  expect(lines.every((l) => l.actual == null)).toBe(true);
  expect(lines.reduce((sum, l) => sum + (l.estimate ?? 0), 0)).toBe(40000);
  expect(lines.find((l) => l.category === "Planning")?.description).toBe("Planner / coordinator");

  const diy = starterBudgetLines(40000, "diy");
  expect(diy.find((l) => l.category === "Planning")?.description).toBe("Day-of coordinator");
  expect(diy.every((l) => l.actual == null)).toBe(true);

  const blank = starterBudgetLines(null, "pro");
  expect(blank.every((l) => l.estimate == null && l.actual == null)).toBe(true);
  expect(blank.every((l) => l.serviceChargePct == null && l.taxPct == null)).toBe(true);
});

test("checklist dates are offsets from the wedding, with PR and Catholic tasks only when they apply", () => {
  const date = "2027-06-12";
  const pr = starterTasks({ date, ceremonyType: "catholic", city: "San Juan, PR", plan: "pro" });
  const byTitle = (title: string) => pr.find((t) => t.title === title);

  expect(byTitle("Get the Puerto Rico medical certificate (valid 10 days)")?.dueDate).toBe("2027-06-02");
  expect(byTitle("Apply for the marriage license (photo ID, birth certificate, two witnesses 21+)")?.dueDate).toBe("2027-06-05");
  expect(byTitle("Contact the parish")?.dueDate).toBe("2026-08-16");
  expect(byTitle("Apply for the marriage license")).toBeUndefined();
  expect(byTitle("Book the officiant")).toBeUndefined();
  expect(pr.some((t) => t.title.includes("Florida"))).toBe(false);
  expect(pr.every((t) => t.done === false)).toBe(true);

  const fl = starterTasks({ date, ceremonyType: "civil", city: "Miami, FL", plan: "diy" });
  expect(fl.find((t) => t.title.startsWith("Apply for the Florida marriage license"))?.dueDate).toBe("2027-05-13");
  expect(fl.some((t) => t.title.includes("Puerto Rico") || t.title.includes("parish") || t.title.includes("Pre-Cana"))).toBe(false);
  expect(fl.find((t) => t.title === "Book the officiant")?.owner).toBe("couple");
  expect(fl.find((t) => t.title === "Book the venue")?.owner).toBe("couple");

  const elsewhere = starterTasks({ date, ceremonyType: "symbolic", city: "Austin, TX", plan: "pro" });
  expect(elsewhere.find((t) => t.title === "Apply for the marriage license")?.dueDate).toBe("2027-04-03");
  expect(elsewhere.some((t) => /Florida|Puerto Rico|parish|Pre-Cana/.test(t.title))).toBe(false);

  const undated = starterTasks({ date: null, ceremonyType: "catholic", city: "Ponce, PR", plan: "pro" });
  expect(undated.length).toBeGreaterThan(0);
  expect(undated.every((t) => t.dueDate == null)).toBe(true);
});

test("timeline is anchored to the ceremony time", () => {
  const civil = starterTimeline("17:00", "civil", "pro");
  const ceremony = civil.find((item) => item.title === "Ceremony");
  expect(ceremony).toMatchObject({ time: "17:00", durationMin: 35, notes: "" });
  expect(civil.find((item) => item.title === "Cocktail hour")?.time).toBe("17:35");

  const mass = starterTimeline("16:00", "catholic", "diy");
  expect(mass.find((item) => item.title === "Ceremony")).toMatchObject({
    time: "16:00",
    durationMin: 60,
    notes: "Mass, readings, vows, arras, lazo, recessional.",
  });
  expect(mass.find((item) => item.title === "Cocktail hour")?.time).toBe("17:00");
  expect(mass.find((item) => item.title === "Vendor load-out")?.owner).toBe("Couple");
});
