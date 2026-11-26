import { useRows, useUpdate } from "~/data/hooks";
import type { BudgetLine, Client, Payment, Wedding } from "~/data/types";
import { planningEstimateUpdate, plannerFee, rescaleUnpaidInstallments } from "~/lib/finance";

/**
 * After a fee quote or a budget target changes, unpaid installments and the single
 * Planning budget line follow the new number. Paid installments stay as they are.
 */
export async function followClientFee(args: {
  client: Client;
  weddings: readonly Wedding[];
  lines: readonly BudgetLine[];
  payments: readonly Payment[];
  updatePayment: (id: string, amount: number) => Promise<unknown>;
  updateLine: (id: string, estimate: number) => Promise<unknown>;
}) {
  const own = args.weddings.filter((w) => w.clientId === args.client.id);
  for (const w of own) {
    const fee = plannerFee(args.client, w.budgetTarget);
    const incoming = args.payments.filter((p) => p.weddingId === w.id && p.direction === "incoming");
    for (const change of rescaleUnpaidInstallments(fee, incoming)) {
      await args.updatePayment(change.id, change.amount);
    }
    const line = planningEstimateUpdate(
      args.lines.filter((l) => l.weddingId === w.id),
      fee,
    );
    if (line) await args.updateLine(line.id, line.estimate);
  }
}

/** Saves fee terms, then makes installments and the planning line follow the quote. */
export function useSaveFee() {
  const weddings = useRows("weddings");
  const lines = useRows("budgetLines");
  const payments = useRows("payments");
  const updateClient = useUpdate("clients");
  const updatePayment = useUpdate("payments");
  const updateLine = useUpdate("budgetLines");

  return async (client: Client, patch: Partial<Client>, weddingTarget?: { id: string; budgetTarget: number }) => {
    const next = { ...client, ...patch };
    if (Object.keys(patch).length > 0) await updateClient.mutateAsync({ id: client.id, patch });
    const nextWeddings = weddingTarget
      ? weddings.map((w) => (w.id === weddingTarget.id ? { ...w, budgetTarget: weddingTarget.budgetTarget } : w))
      : weddings;
    await followClientFee({
      client: next,
      weddings: nextWeddings,
      lines,
      payments,
      updatePayment: (id, amount) => updatePayment.mutateAsync({ id, patch: { amount } }),
      updateLine: (id, estimate) => updateLine.mutateAsync({ id, patch: { estimate } }),
    });
  };
}
