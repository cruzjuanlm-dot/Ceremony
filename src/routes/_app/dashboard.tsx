import { createFileRoute } from "@tanstack/react-router";

import { DiyDashboard } from "~/components/dashboard/diy-dashboard";
import { ProDashboard } from "~/components/dashboard/pro-dashboard";
import { useWorkspace } from "~/data/hooks";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

/** Where you LEARN — nothing here edits; every actionable thing links into its page. */
function DashboardPage() {
  const ws = useWorkspace();
  return ws.plan === "pro" ? <ProDashboard /> : <DiyDashboard />;
}
