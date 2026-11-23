import { expect, test } from "bun:test";

import type { Dataset } from "./types";
import { migrateDemoDataset } from "./store";

test("a saved demo gains blank service-charge fields and keeps a legacy flat fee", () => {
  const legacy = {
    tables: {
      clients: [{ planningFee: 4000 }],
      budgetLines: [{ description: "Venue rental", estimate: 9000 }],
    },
  } as unknown as Dataset;

  const next = migrateDemoDataset(legacy);
  expect(next.tables.clients[0]?.feeModel).toBe("flat");
  expect(next.tables.clients[0]?.feeFlat).toBe(4000);
  expect(next.tables.clients[0]?.feePercent).toBeNull();
  expect(next.tables.budgetLines[0]?.serviceChargePct).toBeNull();
  expect(next.tables.budgetLines[0]?.taxPct).toBeNull();

  const again = migrateDemoDataset(next);
  expect(again.tables.budgetLines[0]?.serviceChargePct).toBeNull();
  expect(again.tables.clients[0]?.feeFlat).toBe(4000);
});
