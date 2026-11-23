import { expect, test } from "bun:test";

import type { FeeTerms } from "../data/types";
import { seedDataset } from "../data/seed";
import {
  plannerFee,
  plannerInstallments,
  planningEstimateUpdate,
  rescaleUnpaidInstallments,
  splitAmount,
} from "./finance";

const blank: FeeTerms = { feeModel: "flat", feeFlat: null, feePercent: null, feeHours: null, feeRate: null };

test("flat fee is the number typed, and a blank flat fee stays blank", () => {
  expect(plannerFee({ ...blank, feeFlat: 6500 }, null)).toBe(6500);
  expect(plannerFee(blank, 34000)).toBeNull();
  expect(plannerFee({ ...blank, feeFlat: 0 }, null)).toBe(0);
});

test("percent of the budget target, blank when either side is blank", () => {
  expect(plannerFee({ ...blank, feeModel: "percent", feePercent: 14 }, 68000)).toBe(9520);
  expect(plannerFee({ ...blank, feeModel: "percent", feePercent: 12 }, null)).toBeNull();
  expect(plannerFee({ ...blank, feeModel: "percent", feePercent: null }, 68000)).toBeNull();
  expect(plannerFee({ ...blank, feeModel: "percent", feePercent: 0 }, 68000)).toBe(0);
});

test("hybrid is the base plus a percent, and a missing half stays blank", () => {
  expect(plannerFee({ ...blank, feeModel: "hybrid", feeFlat: 2500, feePercent: 5 }, 95000)).toBe(7250);
  expect(plannerFee({ ...blank, feeModel: "hybrid", feeFlat: 2500, feePercent: null }, 95000)).toBeNull();
  expect(plannerFee({ ...blank, feeModel: "hybrid", feeFlat: null, feePercent: 5 }, 95000)).toBeNull();
  expect(plannerFee({ ...blank, feeModel: "hybrid", feeFlat: 2500, feePercent: 5 }, null)).toBeNull();
});

test("hourly is hours times rate", () => {
  expect(plannerFee({ ...blank, feeModel: "hourly", feeHours: 16, feeRate: 250 }, null)).toBe(4000);
  expect(plannerFee({ ...blank, feeModel: "hourly", feeHours: 16, feeRate: null }, null)).toBeNull();
  expect(plannerFee({ ...blank, feeModel: "hourly", feeHours: null, feeRate: 250 }, null)).toBeNull();
});

test("installments add up to the fee", () => {
  for (const fee of [0, 1, 3200, 7250, 9520, 14000]) {
    const parts = splitAmount(fee, [0.4, 0.3, 0.3]);
    expect(parts.reduce((sum, n) => sum + n, 0)).toBe(fee);
    const rows = plannerInstallments(fee, "2027-08-14", "2026-11-23");
    expect(rows.map((r) => r.label)).toEqual(["Retainer", "Midpoint installment", "Final installment"]);
    expect(rows.reduce((sum, r) => sum + r.amount, 0)).toBe(fee);
    expect(rows[1]?.dueDate).toBe("2027-02-15");
    expect(rows[2]?.dueDate).toBe("2027-07-15");
  }
});

test("a short engagement does not schedule a midpoint that already passed", () => {
  const rows = plannerInstallments(1000, "2027-01-15", "2026-11-23");
  expect(rows.map((r) => r.label)).toEqual(["Retainer", "Final installment"]);
  expect(rows.reduce((sum, r) => sum + r.amount, 0)).toBe(1000);
  const one = plannerInstallments(1000, "2026-11-30", "2026-11-23");
  expect(one).toEqual([{ label: "Planning fee", amount: 1000, dueDate: "2026-11-23" }]);
});

test("unpaid installments follow a new fee and paid ones stay put", () => {
  const scaled = rescaleUnpaidInstallments(1000, [
    { id: "a", amount: 200, paidDate: null },
    { id: "b", amount: 300, paidDate: null },
  ]);
  expect(scaled).toEqual([
    { id: "a", amount: 400 },
    { id: "b", amount: 600 },
  ]);

  const withPaid = rescaleUnpaidInstallments(1000, [
    { id: "paid", amount: 400, paidDate: "2026-01-01" },
    { id: "open", amount: 900, paidDate: null },
  ]);
  expect(withPaid).toEqual([{ id: "open", amount: 600 }]);

  expect(rescaleUnpaidInstallments(null, [{ id: "a", amount: 100, paidDate: null }])).toEqual([]);
  expect(
    rescaleUnpaidInstallments(500, [
      { id: "paid", amount: 800, paidDate: "2026-01-01" },
      { id: "open", amount: 100, paidDate: null },
    ]),
  ).toEqual([]);
});

test("the planning line estimate follows a known fee and a blank fee leaves it", () => {
  const lines = [
    { id: "p", category: "Planning" as const, estimate: 1000, actual: null, weddingId: "w", description: "", bookingId: null, paidBy: "couple" as const },
  ];
  expect(planningEstimateUpdate(lines, 7250)).toEqual({ id: "p", estimate: 7250 });
  expect(planningEstimateUpdate(lines, null)).toBeNull();
  expect(planningEstimateUpdate(lines, 1000)).toBeNull();
});

test("seeded Pro installments add up to the computed fee", () => {
  const data = seedDataset("pro", new Date(2026, 10, 23));
  for (const client of data.tables.clients) {
    const wedding = data.tables.weddings.find((w) => w.clientId === client.id);
    if (!wedding?.date) continue;
    const fee = plannerFee(client, wedding.budgetTarget);
    const incoming = data.tables.payments.filter((p) => p.weddingId === wedding.id && p.direction === "incoming");
    expect(fee).not.toBeNull();
    expect(incoming.reduce((sum, p) => sum + p.amount, 0)).toBe(fee);
  }
});
