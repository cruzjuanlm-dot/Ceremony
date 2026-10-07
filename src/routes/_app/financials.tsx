import { createFileRoute } from "@tanstack/react-router";

import { DiyFinancials } from "~/components/financials/diy-financials";
import { ProFinancials } from "~/components/financials/pro-financials";
import { useWorkspace } from "~/data/hooks";

export const Route = createFileRoute("/_app/financials")({
  component: FinancialsPage,
});

function FinancialsPage() {
  const ws = useWorkspace();
  return ws.plan === "pro" ? <ProFinancials /> : <DiyFinancials />;
}
