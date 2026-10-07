import type { Client, ClientStatus } from "~/data/types";

/**
 * The planner's own pipeline money (fees, not wedding budgets). Kept beside the Clients
 * screen; candidate for finance.ts if the dashboard needs the same numbers.
 */
export function clientPipeline(clients: Client[]) {
  const sum = (statuses: ClientStatus[]) =>
    clients.filter((c) => statuses.includes(c.status)).reduce((s, c) => s + c.planningFee, 0);
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

/** Sum of planning fees for a set of clients (a board column's total). */
export const feeTotal = (clients: Client[]) => clients.reduce((s, c) => s + c.planningFee, 0);
