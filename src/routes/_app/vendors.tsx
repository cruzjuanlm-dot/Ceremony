import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/vendors")({
  component: VendorsPage,
});

function VendorsPage() {
  return <PageHeader title="Vendors" />;
}
