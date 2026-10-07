import { createFileRoute } from "@tanstack/react-router";

import { DemoCard } from "~/components/settings/demo-card";
import { PlanCard } from "~/components/settings/plan-card";
import { WorkspaceCard } from "~/components/settings/workspace-card";
import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" />
      <div className="grid gap-6">
        <WorkspaceCard />
        <PlanCard />
        <DemoCard />
      </div>
    </div>
  );
}
