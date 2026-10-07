import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/studio")({
  component: StudioPage,
});

function StudioPage() {
  return <PageHeader title="Design studio" />;
}
