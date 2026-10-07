import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/financials")({
  component: FinancialsPage,
});

function FinancialsPage() {
  return <PageHeader title="Financials" />;
}
