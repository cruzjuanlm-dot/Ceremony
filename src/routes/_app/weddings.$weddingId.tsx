import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/weddings/$weddingId")({
  component: WeddingPage,
});

function WeddingPage() {
  return <PageHeader title="Wedding" />;
}
