import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { SegmentedControl } from "@libretto-ui/segmented-control";

import { AddAppointmentButton } from "~/components/calendar/add-appointment-dialog";
import { Agenda, AGENDA_DAYS } from "~/components/calendar/agenda";
import { buildItems, matchesFilter, monthKey, monthLabel, shiftMonth, type CalFilter } from "~/components/calendar/items";
import { MonthGrid } from "~/components/calendar/month-grid";
import { useRows } from "~/data/hooks";
import { todayIso } from "~/lib/finance";
import { PageHeader } from "~/shared/libretto";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

type View = "month" | "agenda";

/** Phones get the agenda first — a 7-column month is a glance there, not a workspace. */
function initialView(): View {
  try {
    return window.matchMedia("(min-width: 768px)").matches ? "month" : "agenda";
  } catch {
    return "month";
  }
}

function CalendarPage() {
  const weddings = useRows("weddings");
  const appointments = useRows("appointments");
  const tasks = useRows("tasks");
  const payments = useRows("payments");
  const bookings = useRows("bookings");
  const vendors = useRows("vendors");
  const today = todayIso();

  const [view, setView] = useState<View>(initialView);
  const [filter, setFilter] = useState<CalFilter>("all");
  const [month, setMonth] = useState(() => monthKey(today));

  const items = useMemo(
    () => buildItems({ weddings, appointments, tasks, payments, bookings, vendors, today }),
    [weddings, appointments, tasks, payments, bookings, vendors, today],
  );
  const shown = items.filter((i) => matchesFilter(i, filter));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Calendar & planner" actions={<AddAppointmentButton />} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Calendar view"
          value={view}
          onValueChange={setView}
          options={[
            { value: "month", label: "Month" },
            { value: "agenda", label: "Agenda" },
          ]}
        />
        <div className="max-w-full overflow-x-auto">
          <SegmentedControl
            aria-label="Show"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "wedding", label: "Weddings" },
              { value: "appointment", label: "Appointments" },
              { value: "task", label: "Tasks" },
              { value: "payment", label: "Payments" },
            ]}
          />
        </div>
      </div>

      {view === "month" ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="min-w-40 text-lg font-semibold">{monthLabel(month)}</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {month !== monthKey(today) && (
              <Button variant="outline" size="sm" className="h-8" onClick={() => setMonth(monthKey(today))}>
                Today
              </Button>
            )}
          </div>
          {/* Done tasks are history; the agenda keeps them so a tick can be undone. */}
          <MonthGrid month={month} items={shown.filter((i) => !(i.kind === "task" && i.task.done))} today={today} />
        </>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold">Next {AGENDA_DAYS} days</h2>
          <Agenda items={shown} today={today} />
        </>
      )}
    </div>
  );
}
