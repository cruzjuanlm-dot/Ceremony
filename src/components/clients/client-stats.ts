import type { Client, ClientStatus, Wedding } from "~/data/types";
import { plannerFee, sumKnown } from "~/lib/finance";

/**
 * The planner's fee for this client. One number per wedding (a percent uses that
 * wedding's budget target); several weddings add up. Flat and hourly don't need a wedding.
 * A blank quote stays blank — it is not $0.
 */
export function clientFee(client: Client, weddings: readonly Pick<Wedding, "clientId" | "budgetTarget">[]): number | null {
  const own = weddings.filter((w) => w.clientId === client.id);
  if (own.length === 0) return plannerFee(client, null);
  return sumKnown(own.map((w) => plannerFee(client, w.budgetTarget)));
}

/**
 * The planner's own pipeline money (fees, not wedding budgets).
 */
export function clientPipeline(clients: Client[], weddings: readonly Pick<Wedding, "clientId" | "budgetTarget">[]) {
  const fee = (c: Client) => clientFee(c, weddings);
  const sum = (statuses: ClientStatus[]) => sumKnown(clients.filter((c) => statuses.includes(c.status)).map(fee));
  const count = (statuses: ClientStatus[]) => clients.filter((c) => statuses.includes(c.status)).length;
  return {
    bookedRevenue: sum(["booked", "completed"]),
    bookedCount: count(["booked", "completed"]),
    pipelineValue: sum(["inquiry", "proposal"]),
    pipelineCount: count(["inquiry", "proposal"]),
  };
}

export const clientName = (c: Pick<Client, "partner1" | "partner2">) =>
  [c.partner1, c.partner2].filter(Boolean).join(" & ");

/** Sum of known planning fees for a set of clients (a board column's total). */
export const feeTotal = (clients: Client[], weddings: readonly Pick<Wedding, "clientId" | "budgetTarget">[]) =>
  sumKnown(clients.map((c) => clientFee(c, weddings)));
