import { Link } from "@tanstack/react-router";

import { Button } from "@libretto-ui/button";

import { CoupleName, EmptyState, Meter, Panel } from "~/components/kit";
import { PaymentChip } from "~/components/status";
import { useRows, useWorkspace } from "~/data/hooks";
import { budgetSummary, guestSummary, paymentState, todayIso } from "~/lib/finance";
import { dateLong, dateShort, money, relativeTime } from "~/lib/format";
import { daysUntil } from "~/lib/wedding";
import { cn, PageHeader } from "~/shared/libretto";

import { WeddingLink, type WeddingTab } from "./wedding-link";

export function DiyDashboard() {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const allTasks = useRows("tasks");
  const allLines = useRows("budgetLines");
  const allGuests = useRows("guests");
  const allPayments = useRows("payments");
  const bookings = useRows("bookings");
  const vendors = useRows("vendors");
  const emails = useRows("emails");
  const today = todayIso();

  const w = weddings[0];
  if (!w) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Dashboard" />
        <EmptyState title="No wedding yet" />
      </div>
    );
  }

  const days = daysUntil(w, today);
  const venue = vendors.find((v) => v.id === w.venueId);
  const tasks = allTasks.filter((t) => t.weddingId === w.id);
  const done = tasks.filter((t) => t.done).length;
  const nextTasks = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    .slice(0, 4);
  const budget = budgetSummary(allLines.filter((l) => l.weddingId === w.id), w.budgetTarget);
  const guests = guestSummary(allGuests.filter((g) => g.weddingId === w.id));
  const vendorName = (bookingId: string | null) => {
    const b = bookings.find((x) => x.id === bookingId);
    return vendors.find((v) => v.id === b?.vendorId)?.name ?? null;
  };
  const duePayments = allPayments
    .filter((p) => p.weddingId === w.id && p.direction === "outgoing" && !p.paidDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  const vendorEmails = emails
    .filter((e) => e.direction === "in" && (e.weddingId === w.id || e.weddingId == null))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Dashboard" description={ws.ownerName} />

      <section className="fade-up rounded-xl bg-card px-6 py-8 text-center elevate sm:py-10">
        <WeddingLink weddingId={w.id} className="hover:no-underline">
          <CoupleName className="text-4xl sm:text-5xl">{w.title}</CoupleName>
        </WeddingLink>
        <div className="mt-4 text-primary">
          {days == null ? (
            <span className="text-2xl font-semibold">Date to be set</span>
          ) : days > 1 ? (
            <>
              <span className="text-5xl font-semibold tabular-nums sm:text-6xl">{days}</span>
              <span className="ml-2 text-xl font-medium">days to go</span>
            </>
          ) : (
            <span className="text-4xl font-semibold">{days === 1 ? "Tomorrow" : days === 0 ? "Today" : "Married"}</span>
          )}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          {[w.date ? dateLong(w.date) : null, venue?.name, w.city].filter(Boolean).join(" · ") || "—"}
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="Checklist" className="min-w-0" actions={<TabLink weddingId={w.id} tab="checklist" />}>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold tabular-nums">
                  {done} <span className="font-normal text-muted-foreground">of {tasks.length} done</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{Math.round((done / tasks.length) * 100)}%</span>
              </div>
              <Meter className="mt-2" value={done} max={tasks.length} label="Checklist progress" />
              <ul className="mt-3 space-y-1.5 text-sm">
                {nextTasks.map((t) => (
                  <li key={t.id} className="flex gap-2">
                    <span
                      className={cn(
                        "w-[4.75rem] shrink-0 whitespace-nowrap text-xs tabular-nums leading-5",
                        t.dueDate && t.dueDate < today ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
                      )}
                    >
                      {dateShort(t.dueDate)}
                    </span>
                    <span className="min-w-0 truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="Budget" className="min-w-0" actions={<TabLink weddingId={w.id} tab="budget" />}>
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn("text-2xl font-semibold tabular-nums", budget.overBudget && "text-red-600 dark:text-red-400")}>
              {budget.projected ? money(budget.projected) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">of {money(budget.target)} target</span>
          </div>
          <Meter
            className="mt-2"
            value={budget.projected}
            max={budget.target}
            tone={budget.overBudget ? "bad" : "brand"}
            label="Projected spend against target"
          />
          <div className="mt-2 text-xs">
            {budget.overBudget ? (
              <span className="font-medium text-red-600 dark:text-red-400">{money(-budget.remaining)} over target</span>
            ) : (
              <span className="text-muted-foreground">{money(budget.remaining)} left to plan</span>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Estimated</dt>
              <dd className="tabular-nums">{budget.estimate ? money(budget.estimate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contracted</dt>
              <dd className="tabular-nums">{budget.actual ? money(budget.actual) : "—"}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="RSVPs" actions={<TabLink weddingId={w.id} tab="guests" />} className="min-w-0 md:col-span-2 lg:col-span-1">
          {guests.invited === 0 ? (
            <div>
              <div className="text-sm font-medium">Invitations not sent yet</div>
              <div className="mt-1 text-xs text-muted-foreground">~{w.guestEstimate} guests expected</div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold tabular-nums">
                  {guests.attending} <span className="font-normal text-muted-foreground">attending</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{guests.invited} invited</span>
              </div>
              <Meter
                className="mt-2"
                value={guests.attending + guests.declined}
                max={guests.invited}
                tone="good"
                label="Replies received"
              />
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Attending</dt>
                  <dd className="tabular-nums text-emerald-700 dark:text-emerald-400">{guests.attending}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Awaiting</dt>
                  <dd className="tabular-nums text-amber-700 dark:text-amber-400">{guests.pending}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Declined</dt>
                  <dd className="tabular-nums">{guests.declined}</dd>
                </div>
              </dl>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel
          title="Next payments"
          className="min-w-0"
          actions={
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link to="/financials">All payments</Link>
            </Button>
          }
          bodyClassName="py-1"
        >
          {duePayments.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {duePayments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{vendorName(p.bookingId) ?? p.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.label} · {dateShort(p.dueDate)}
                    </div>
                  </div>
                  <span className="tabular-nums">{money(p.amount)}</span>
                  <PaymentChip state={paymentState(p, today)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Latest vendor emails"
          className="min-w-0"
          actions={
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Link to="/inbox">Email log</Link>
            </Button>
          }
          bodyClassName="py-1"
        >
          {vendorEmails.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {vendorEmails.map((e) => (
                <li key={e.id}>
                  <Link to="/inbox" className="block py-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      {!e.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary">
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                      <span className={cn("truncate", !e.read && "font-medium")}>{e.fromName}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relativeTime(e.sentAt)}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{e.subject}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function TabLink({ weddingId, tab }: { weddingId: string; tab: WeddingTab }) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
      <WeddingLink weddingId={weddingId} tab={tab} className="hover:no-underline">
        Open
      </WeddingLink>
    </Button>
  );
}
