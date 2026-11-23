import { expect, test } from "bun:test";

import type { BudgetLine, FeeTerms } from "../data/types";
import { seedDataset } from "../data/seed";
import {
  budgetSummary,
  plannerFee,
  plannerInstallments,
  planningEstimateUpdate,
  rescaleUnpaidInstallments,
  lineVariance,
  serviceChargeAndTax,
  splitAmount,
  splitContract,
  suggestedTip,
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
    { id: "p", category: "Planning" as const, estimate: 1000, actual: null, weddingId: "w", description: "", bookingId: null, paidBy: "couple" as const, serviceChargePct: null, taxPct: null },
  ];
  expect(planningEstimateUpdate(lines, 7250)).toEqual({ id: "p", estimate: 7250 });
  expect(planningEstimateUpdate(lines, null)).toBeNull();
  expect(planningEstimateUpdate(lines, 1000)).toBeNull();
});

function line(partial: Partial<BudgetLine> & Pick<BudgetLine, "estimate" | "actual">): BudgetLine {
  return {
    id: "l",
    weddingId: "w",
    category: "Venue & catering",
    description: "Catering & bar",
    bookingId: null,
    paidBy: "couple",
    serviceChargePct: null,
    taxPct: null,
    ...partial,
  };
}

test("service charge and tax sit on the contract, and a blank stays blank", () => {
  expect(serviceChargeAndTax(null, 20, 11.5)).toEqual({
    serviceCharge: null,
    tax: null,
    addOn: null,
    total: null,
  });
  expect(serviceChargeAndTax(10000, null, null)).toEqual({
    serviceCharge: null,
    tax: null,
    addOn: null,
    total: 10000,
  });
  expect(serviceChargeAndTax(10000, 0, 0)).toEqual({
    serviceCharge: 0,
    tax: 0,
    addOn: 0,
    total: 10000,
  });
  expect(serviceChargeAndTax(10000, 20, null)).toEqual({
    serviceCharge: 2000,
    tax: null,
    addOn: 2000,
    total: 12000,
  });
  expect(serviceChargeAndTax(10000, null, 7)).toEqual({
    serviceCharge: null,
    tax: 700,
    addOn: 700,
    total: 10700,
  });
  // Tax is on the contract plus the mandatory service charge: 12,000 × 11.5%.
  expect(serviceChargeAndTax(10000, 20, 11.5)).toEqual({
    serviceCharge: 2000,
    tax: 1380,
    addOn: 3380,
    total: 13380,
  });
});

test("the difference column stays on the contract", () => {
  const row = line({ estimate: 10000, actual: 11000, serviceChargePct: 20, taxPct: 11.5 });
  expect(lineVariance(row)).toBe(-1000);
  expect(serviceChargeAndTax(11000, 20, 11.5).total).not.toBe(11000);
});

test("a service charge is not a tip", () => {
  const charge = serviceChargeAndTax(10000, 20, 11.5);
  expect(charge.serviceCharge).not.toBe(suggestedTip(10000, "catering"));
  expect(charge.addOn).not.toBe(suggestedTip(10000, "catering"));
});

test("budget totals include the charge once, and a blank percent adds nothing", () => {
  const plain = budgetSummary([line({ estimate: 1000, actual: null })], 5000);
  expect(plain.projected).toBe(1000);
  expect(plain.serviceAndTax).toBe(0);
  expect(plain.chargesKnown).toBe(false);

  const charged = budgetSummary(
    [line({ estimate: 10000, actual: null, serviceChargePct: 20, taxPct: 11.5 })],
    20000,
  );
  expect(charged.contractEstimate).toBe(10000);
  expect(charged.serviceAndTax).toBe(3380);
  expect(charged.projected).toBe(13380);
  expect(charged.estimate).toBe(13380);
  expect(charged.chargesKnown).toBe(true);

  const over = line({ estimate: 10000, actual: 11000, serviceChargePct: 20, taxPct: null });
  const compared = budgetSummary([over], 20000);
  expect(compared.projected).toBe(13200);
  expect(compared.serviceAndTax).toBe(2200);
});

test("splitting an all-in figure lands within a dollar", () => {
  expect(splitContract(5000, null, null)).toEqual({ base: 5000, total: 5000 });
  for (const allIn of [100, 6120, 18000, 33333]) {
    const split = splitContract(allIn, 20, 11.5);
    expect(Math.abs(split.total - allIn)).toBeLessThanOrEqual(1);
    expect(split.base).toBeLessThan(allIn);
    expect(serviceChargeAndTax(split.base, 20, 11.5).total).toBe(split.total);
  }
});

test("seeded venue and catering lines carry a service charge, and tips do not", () => {
  for (const plan of ["pro", "diy"] as const) {
    const data = seedDataset(plan, new Date(2026, 10, 23));
    const charged = data.tables.budgetLines.filter(
      (l) => l.description === "Venue rental" || l.description === "Catering & bar",
    );
    expect(charged.length).toBeGreaterThan(0);
    for (const row of data.tables.budgetLines) {
      const wedding = data.tables.weddings.find((w) => w.id === row.weddingId);
      if (row.description === "Venue rental" || row.description === "Catering & bar") {
        expect(row.serviceChargePct).toBeGreaterThanOrEqual(18);
        expect(row.serviceChargePct).toBeLessThanOrEqual(22);
        const tax = wedding?.city.includes("FL") ? 7 : 11.5;
        expect(row.taxPct).toBe(tax);
        if (row.actual != null && row.bookingId) {
          const booking = data.tables.bookings.find((b) => b.id === row.bookingId);
          expect(booking?.amount).toBe(serviceChargeAndTax(row.actual, row.serviceChargePct, row.taxPct).total);
        }
      } else {
        expect(row.serviceChargePct).toBeNull();
        expect(row.taxPct).toBeNull();
      }
    }
  }
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
