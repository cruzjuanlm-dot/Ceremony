import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/inbox")({
  component: InboxPage,
});

function InboxPage() {
  return <PageHeader title="Email log" />;
}
