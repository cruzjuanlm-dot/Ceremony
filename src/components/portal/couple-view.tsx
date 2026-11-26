import { CloudRain, MapPin } from "lucide-react";

import { Chip, CoupleName, Panel, StatTile } from "~/components/kit";
import { DocStatusChip, PaymentChip, PhaseChip, RsvpChip } from "~/components/status";
import { dateLong, dateShort, money, time12 } from "~/lib/format";
import { MEAL_LABEL } from "~/lib/wedding";
import type { OpenPortal, PortalPaymentSide } from "~/lib/portal";
import { cn } from "~/shared/libretto";

/** The couple's read-only plan. Renders a projection — it has no save actions. */
export function CouplePortalView({ view }: { view: OpenPortal }) {
  const brand = view.brand === view.title ? "Ceremony" : view.brand;
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to the plan
      </a>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="font-display text-xl font-semibold tracking-tight">{brand}</div>
          <Chip tone="muted">Read only</Chip>
        </div>
      </header>
      <main id="portal-main" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Hero view={view} />
        <div className="mt-8 flex flex-col gap-6">
          {view.tasks && <TaskSection tasks={view.tasks} />}
          {view.timeline && <TimelineSection rows={view.timeline} />}
          {(view.budget || view.payments) && (
            <div className={cn("grid gap-6", view.budget && view.payments && "lg:grid-cols-2")}>
              {view.budget && <BudgetSection budget={view.budget} />}
              {view.payments && <PaymentsSection payments={view.payments} />}
            </div>
          )}
          {(view.vendors || view.files) && (
            <div className={cn("grid gap-6", view.vendors && view.files && "lg:grid-cols-2")}>
              {view.vendors && <VendorSection rows={view.vendors} />}
              {view.files && <FileSection rows={view.files} />}
            </div>
          )}
          {view.guests && <GuestSection guests={view.guests} />}
        </div>
      </main>
    </div>
  );
}

export function ClosedPortal({ reason }: { reason: "off" | "missing" }) {
  const copy =
    reason === "off"
      ? { title: "This view is turned off", detail: "The planner can turn it back on." }
      : { title: "This plan is not on this device", detail: "Open the link in the browser where the wedding is saved." };
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy.detail}</p>
    </main>
  );
}

function Hero({ view }: { view: OpenPortal }) {
  return (
    <section className="rounded-xl bg-card p-5 elevate sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0">
          <CoupleName className="text-3xl leading-tight sm:text-4xl lg:text-5xl">{view.title}</CoupleName>
        </h1>
        <PhaseChip phase={view.phase} />
        <span className="text-sm text-muted-foreground">{view.countdown}</span>
      </div>
      {view.style && <p className="mt-2 text-sm text-muted-foreground">{view.style}</p>}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        <Fact label="Date" value={dateLong(view.date)} />
        <Fact label="Ceremony" value={time12(view.ceremonyTime)} />
        <Fact label="City" value={view.city || "—"} />
        <Fact label="Ceremony type" value={view.ceremony} />
        <Fact label="Guests" value={`~${view.guestEstimate}`} />
        <div className="col-span-2 min-w-0 sm:col-span-1 lg:col-span-2">
          <dt className="text-xs text-muted-foreground">Venue</dt>
          <dd className="mt-0.5 break-words text-sm">
            {view.venueName ? (
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  {view.venueName}
                  {view.venueAddress && <span className="mt-0.5 block text-muted-foreground">{view.venueAddress}</span>}
                </span>
              </span>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
      {view.rainPlan && (
        <p className="mt-5 flex items-start gap-2 text-sm">
          <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            <span className="font-medium">Rain plan. </span>
            {view.rainPlan}
          </span>
        </p>
      )}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{value}</dd>
    </div>
  );
}

function TaskSection({ tasks }: { tasks: NonNullable<OpenPortal["tasks"]> }) {
  return (
    <Panel title="Your tasks">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks for you yet.</p>
      ) : (
        <ul className="divide-y">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
              <div className="min-w-0">
                <div className="break-words text-sm font-medium">{task.title}</div>
                <div className="text-xs text-muted-foreground">
                  {task.phase}
                  {task.dueDate ? ` · ${dateShort(task.dueDate)}` : ""}
                </div>
              </div>
              <Chip tone={task.done ? "good" : task.overdue ? "bad" : "muted"}>{task.done ? "Done" : task.overdue ? "Overdue" : "Open"}</Chip>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TimelineSection({ rows }: { rows: NonNullable<OpenPortal["timeline"]> }) {
  return (
    <Panel title="Timeline">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No timeline yet.</p>
      ) : (
        <ol className="divide-y">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-3 py-3">
              <time dateTime={row.time} className="w-16 shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground">
                {time12(row.time)}
              </time>
              <div className="min-w-0">
                <div className="break-words text-sm font-medium">{row.title}</div>
                <div className="break-words text-xs text-muted-foreground">
                  {row.segment} · {row.location} · {row.owner} · <span className="whitespace-nowrap">{row.durationMin} min</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function BudgetSection({ budget }: { budget: NonNullable<OpenPortal["budget"]> }) {
  return (
    <Panel title="Budget">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Target" value={money(budget.target)} />
        <StatTile label="Projected" value={money(budget.projected)} tone={budget.projected == null ? "muted" : "info"} />
        <StatTile
          className="col-span-2 sm:col-span-1"
          label={budget.overBudget ? "Over budget" : "Remaining"}
          value={budget.remaining == null ? "—" : money(Math.abs(budget.remaining))}
          tone={budget.remaining == null ? "muted" : budget.overBudget ? "bad" : "good"}
        />
      </div>
      {budget.categories.length > 0 && (
        <ul className="mt-4 divide-y">
          {budget.categories.map((row) => (
            <li key={row.category} className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 break-words">{row.category}</span>
              <span className="shrink-0 tabular-nums">{money(row.projected)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function PaymentsSection({ payments }: { payments: NonNullable<OpenPortal["payments"]> }) {
  const hasOutgoing = payments.outgoing.rows.length > 0;
  const hasIncoming = payments.incoming.rows.length > 0;
  return (
    <Panel title="Payments">
      {!hasOutgoing && !hasIncoming ? (
        <p className="text-sm text-muted-foreground">No payments scheduled.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {hasOutgoing && <PaymentList title="Vendor payments" side={payments.outgoing} />}
          {hasIncoming && <PaymentList title="Planner fee" side={payments.incoming} />}
        </div>
      )}
    </Panel>
  );
}

function PaymentList({ title, side }: { title: string; side: PortalPaymentSide }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Paid {money(side.totals.paid)} · Outstanding {money(side.totals.outstanding)}
        {side.totals.overdue > 0 ? ` · Overdue ${money(side.totals.overdue)}` : ""}
      </p>
      <ul className="mt-2 divide-y">
        {side.rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
            <div className="min-w-0">
              <div className="break-words text-sm">{row.label}</div>
              <div className="text-xs text-muted-foreground">{dateShort(row.dueDate)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums">{money(row.amount)}</span>
              <PaymentChip state={row.state} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VendorSection({ rows }: { rows: NonNullable<OpenPortal["vendors"]> }) {
  return (
    <Panel title="Vendors">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No booked vendors yet.</p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.id} className="py-3">
              <div className="break-words text-sm font-medium">{row.name}</div>
              <div className="break-words text-xs text-muted-foreground">
                {row.category}
                {row.contactName ? ` · ${row.contactName}` : ""}
                {row.phone ? ` · ${row.phone}` : ""}
                {row.arrival ? ` · Arrives ${time12(row.arrival)}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function FileSection({ rows }: { rows: NonNullable<OpenPortal["files"]> }) {
  return (
    <Panel title="Files">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files to show.</p>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
              <div className="min-w-0">
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center break-words text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {row.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <div className="flex min-h-11 items-center break-words text-sm font-medium">{row.title}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {row.kind}
                  {row.amount != null ? ` · ${money(row.amount)}` : ""}
                </div>
              </div>
              <DocStatusChip status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function GuestSection({ guests }: { guests: NonNullable<OpenPortal["guests"]> }) {
  const { summary } = guests;
  return (
    <Panel title="Guests">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Invited" value={summary.invited} />
        <StatTile label="Attending" value={summary.attending} tone="good" />
        <StatTile label="Awaiting reply" value={summary.pending} tone={summary.pending ? "warn" : "muted"} />
        <StatTile label="Declined" value={summary.declined} tone={summary.declined ? "bad" : "muted"} />
      </div>
      {guests.rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No guests yet.</p>
      ) : (
        <ul className="mt-4 divide-y">
          {guests.rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
              <div className="min-w-0">
                <div className="break-words text-sm font-medium">{row.name}</div>
                <div className="break-words text-xs text-muted-foreground">
                  {[
                    row.household,
                    row.role,
                    row.isChild ? "Child" : "",
                    row.isPlusOne ? "Plus-one" : "",
                    row.meal ? MEAL_LABEL[row.meal] : "",
                    row.dietary,
                    row.table != null ? `Table ${row.table}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <RsvpChip rsvp={row.rsvp} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
