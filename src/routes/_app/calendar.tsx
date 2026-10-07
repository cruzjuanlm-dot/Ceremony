import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  return <PageHeader title="Calendar" />;
}
