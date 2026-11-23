import type { ReactNode } from "react";
import { ArrowRight, CloudRain, MapPin } from "lucide-react";

import { Button } from "@libretto-ui/button";

import { CoupleName, Meter, Panel, toneText, type Tone } from "~/components/kit";
import { PaymentChip } from "~/components/status";
import { useRows, useUpdate, useWeddingRows } from "~/data/hooks";
import type { Vendor, Wedding } from "~/data/types";
import { budgetSummary, guestSummary, paymentState, todayIso } from "~/lib/finance";
import { dateLong, dateShort, money, time12 } from "~/lib/format";
import { CEREMONY_LABEL, daysUntil } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { InlineTextarea } from "./fields";
import { SubEventsPanel } from "./sub-events";
import type { WeddingTab } from "./wedding-helpers";

/** Overview — hero: how ready is this wedding for its day? */
export function OverviewTab({ wedding: w, onOpenTab }: { wedding: Wedding; onOpenTab: (t: WeddingTab) => void }) {
  const today = todayIso();
  const tasks = useWeddingRows("tasks", w.id);
  const lines = useWeddingRows("budgetLines", w.id);
  const guests = useWeddingRows("guests", w.id);
  const bookings = useWeddingRows("bookings", w.id);
  const payments = useWeddingRows("payments", w.id);
  const vendors = useRows("vendors");
  const update = useUpdate("weddings");

  const days = daysUntil(w);
  const done = tasks.filter((t) => t.done).length;
  const overdueTasks = tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length;
  const budget = budgetSummary(lines, w.budgetTarget);
  const g = guestSummary(guests);
  const active = bookings.filter((b) => b.stage !== "declined");
  const booked = active.filter((b) => b.stage === "booked").length;

  const upcoming = payments
    .filter((p) => p.direction === "outgoing" && !p.paidDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const venue = vendors.find((v) => v.id === w.venueId);
  const ceremonyVenue = w.ceremonyVenueId && w.ceremonyVenueId !== w.venueId ? vendors.find((v) => v.id === w.ceremonyVenueId) : undefined;

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* HERO — the countdown and what's left before the day */}
      <section className="rounded-xl bg-card p-5 elevate sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-10">
          <div>
            {days == null ? (
              <CoupleName className="text-4xl">Date TBD</CoupleName>
            ) : days < 0 ? (
              <>
                <CoupleName className="text-4xl">Married</CoupleName>
                <div className="mt-1 text-sm text-muted-foreground">{-days} days ago</div>
              </>
            ) : days === 0 ? (
              <CoupleName className="text-5xl">Today</CoupleName>
            ) : (
              <>
                <div className="text-6xl font-semibold leading-none tabular-nums tracking-tight">{days}</div>
                <div className="mt-2 text-sm text-muted-foreground">{days === 1 ? "day to go" : "days to go"}</div>
              </>
            )}
            <div className="mt-4 text-sm">
              {dateLong(w.date)}
              {w.ceremonyTime && <span className="text-muted-foreground"> · {time12(w.ceremonyTime)}</span>}
            </div>
            <div className="text-sm text-muted-foreground">
              {CEREMONY_LABEL[w.ceremonyType]} ceremony · {w.city || "—"}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <Readiness
              label="Checklist"
              value={tasks.length ? `${done} of ${tasks.length} done` : "No tasks"}
              note={overdueTasks ? `${overdueTasks} overdue` : tasks.length - done ? `${tasks.length - done} open` : tasks.length ? "All done" : null}
              noteTone={overdueTasks ? "bad" : undefined}
              meter={{ value: done, max: tasks.length, tone: "brand" }}
              onClick={() => onOpenTab("checklist")}
            />
            <Readiness
              label="Budget"
              value={
                <>
                  {money(budget.projected)} <span className="font-normal text-muted-foreground">of {money(budget.target)}</span>
                </>
              }
              note={budget.overBudget ? `Over by ${money(-budget.remaining)}` : `${money(budget.remaining)} left`}
              noteTone={budget.overBudget ? "bad" : undefined}
              meter={{ value: budget.projected, max: budget.target, tone: budget.overBudget ? "bad" : "info" }}
              onClick={() => onOpenTab("budget")}
            />
            <Readiness
              label="RSVPs"
              value={g.invited ? `${g.attending} attending` : `~${w.guestEstimate} expected`}
              note={g.invited ? `${g.pending} awaiting · ${g.declined} declined` : "Guest list not started"}
              noteTone={g.pending ? "warn" : undefined}
              meter={{ value: g.attending + g.declined, max: g.invited, tone: "good" }}
              onClick={() => onOpenTab("guests")}
            />
            <Readiness
              label="Vendors"
              value={active.length ? `${booked} of ${active.length} booked` : "None yet"}
              note={active.length - booked ? `${active.length - booked} still open` : active.length ? "Team complete" : null}
              meter={{ value: booked, max: active.length, tone: "good" }}
              onClick={() => onOpenTab("vendors")}
            />
          </div>
        </div>
      </section>

      <SubEventsPanel wedding={w} />

      {/* SUPPORTING */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Next payments"
          actions={
            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground" onClick={() => onOpenTab("budget")}>
              Budget
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          }
          bodyClassName="p-0"
        >
          {upcoming.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing due.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((p) => {
                const b = bookings.find((x) => x.id === p.bookingId);
                const v = b && vendors.find((x) => x.id === b.vendorId);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{v?.name ?? p.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.label} · due {dateShort(p.dueDate)}
                      </div>
                    </div>
                    <PaymentChip state={paymentState(p, today)} />
                    <div className="w-20 text-right tabular-nums">{money(p.amount)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Venue" bodyClassName="grid gap-4">
          {venue ? <VenueBlock name={venue.name} vendor={venue} /> : <p className="text-sm text-muted-foreground">No venue booked yet.</p>}
          {ceremonyVenue && <VenueBlock name={ceremonyVenue.name} vendor={ceremonyVenue} role="Ceremony" />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Important notes">
          <InlineTextarea
            ariaLabel="Important notes"
            placeholder="Add anything everyone needs to know"
            value={w.importantNotes}
            onCommit={(v) => update.mutate({ id: w.id, patch: { importantNotes: v } })}
          />
        </Panel>
        <Panel
          title={
            <span className="inline-flex items-center gap-1.5">
              <CloudRain className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Rain plan
            </span>
          }
        >
          <InlineTextarea
            ariaLabel="Rain plan"
            placeholder="Where does the ceremony move if it rains?"
            value={w.rainPlan}
            onCommit={(v) => update.mutate({ id: w.id, patch: { rainPlan: v } })}
          />
        </Panel>
      </div>
    </div>
  );
}

function Readiness({
  label,
  value,
  note,
  noteTone,
  meter,
  onClick,
}: {
  label: string;
  value: ReactNode;
  note: ReactNode;
  noteTone?: Tone;
  meter: { value: number; max: number; tone: Tone };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-m-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
      <Meter className="mt-2" label={`${label} progress`} value={meter.value} max={meter.max} tone={meter.tone} />
      {note && <div className={cn("mt-1.5 text-xs", noteTone ? toneText(noteTone) : "text-muted-foreground")}>{note}</div>}
    </button>
  );
}

function VenueBlock({
  name,
  vendor,
  role,
}: {
  name: string;
  vendor: Vendor;
  role?: string;
}) {
  const setting = vendor.indoorOutdoor === "both" ? "Indoor & outdoor" : vendor.indoorOutdoor === "indoor" ? "Indoor" : vendor.indoorOutdoor === "outdoor" ? "Outdoor" : null;
  return (
    <div className="flex gap-3">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <div className="font-medium">
          {name}
          {role && <span className="font-normal text-muted-foreground"> · {role}</span>}
        </div>
        <div className="text-muted-foreground">{vendor.address || vendor.city}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {[
            setting,
            vendor.capacity ? `Up to ${vendor.capacity} guests` : null,
            vendor.contactName && `${vendor.contactName}${vendor.phone ? ` · ${vendor.phone}` : ""}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </div>
  );
}
