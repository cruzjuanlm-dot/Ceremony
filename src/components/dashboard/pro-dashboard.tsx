import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CloudRain } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { CoupleName, EmptyState, StatTile } from "~/components/kit";
import { ClientStatusChip, PaymentChip, PhaseChip } from "~/components/status";
import { useRows, useWorkspace } from "~/data/hooks";
import { paymentTotals, todayIso, type PaymentState, type PaymentTotals } from "~/lib/finance";
import { dateLong, dateShort, money, moneyCompact, relativeTime } from "~/lib/format";
import { countdownLabel, daysUntil, weddingPhase } from "~/lib/wedding";
import { cn, PageHeader } from "~/shared/libretto";

import { byDate, snapshot, type DashboardRows, type WeddingSnapshot } from "./summaries";
import { WeddingLink } from "./wedding-link";

/** Weddings this close are "needing attention" and earn the hero. */
const ATTENTION_DAYS = 14;

function useDashboardRows(): DashboardRows {
  return {
    clients: useRows("clients"),
    vendors: useRows("vendors"),
    bookings: useRows("bookings"),
    payments: useRows("payments"),
    tasks: useRows("tasks"),
    emails: useRows("emails"),
    guests: useRows("guests"),
  };
}

/** One payment-state word for a set of installments — reuses PaymentChip's vocabulary. */
function rollupState(t: PaymentTotals, count: number): PaymentState | null {
  if (count === 0) return null;
  if (t.overdueCount > 0) return "overdue";
  if (t.outstanding === 0) return "paid";
  if (t.dueSoonCount > 0) return "due_soon";
  return "scheduled";
}

export function ProDashboard() {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const rows = useDashboardRows();
  const navigate = useNavigate();
  const today = todayIso();

  const upcoming = weddings.filter((w) => w.date == null || w.date >= today).sort(byDate);
  const snaps = upcoming.map((w) => snapshot(w, rows, today));
  const dated = snaps.filter((s) => s.wedding.date);
  const soon = dated.filter((s) => (daysUntil(s.wedding, today) ?? 99) <= ATTENTION_DAYS);
  const [hero, ...alsoSoon] = soon.length ? soon : dated.slice(0, 1);

  const month = today.slice(0, 7);
  const thisMonth = weddings.filter((w) => w.date?.startsWith(month) && w.date >= today).length;
  const upcomingIds = new Set(upcoming.map((w) => w.id));
  const vendorTotals = paymentTotals(
    rows.payments.filter((p) => p.direction === "outgoing" && upcomingIds.has(p.weddingId)),
    today,
  );
  const unread = rows.emails.filter((e) => e.direction === "in" && !e.read).length;
  const inquiries = rows.clients.filter((c) => c.status === "inquiry").length;
  const proposals = rows.clients.filter((c) => c.status === "proposal").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Dashboard" description={`${ws.name} · ${upcoming.length} upcoming weddings`} />

      {hero ? (
        <Hero s={hero} also={alsoSoon} today={today} />
      ) : (
        <EmptyState title="No upcoming weddings" action={<Button asChild><Link to="/weddings">Go to weddings</Link></Button>}>
          Add a wedding to see its tasks, payments and emails here.
        </EmptyState>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <TileLink to="/weddings">
          <StatTile label="Weddings this month" value={thisMonth} sub={`${upcoming.length} upcoming in all`} />
        </TileLink>
        <TileLink to="/financials">
          <StatTile
            label="Owed to vendors"
            value={moneyCompact(vendorTotals.outstanding)}
            sub={vendorTotals.dueSoon ? `${money(vendorTotals.dueSoon)} due in 14 days` : "Nothing due in 14 days"}
          />
        </TileLink>
        <TileLink to="/financials">
          <StatTile
            label="Overdue payments"
            value={vendorTotals.overdueCount}
            tone={vendorTotals.overdueCount ? "bad" : undefined}
            sub={vendorTotals.overdueCount ? money(vendorTotals.overdue) : "All caught up"}
          />
        </TileLink>
        <TileLink to="/inbox">
          <StatTile label="Unread emails" value={unread} tone={unread ? "brand" : undefined} sub="Email log" />
        </TileLink>
        <TileLink to="/clients" className="col-span-2 md:col-span-1">
          <StatTile
            label="Pending inquiries"
            value={inquiries}
            tone={inquiries ? "warn" : undefined}
            sub={`${proposals} proposal${proposals === 1 ? "" : "s"} out`}
          />
        </TileLink>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-base font-semibold">Upcoming weddings</h2>
        {snaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wedding</TableHead>
                <TableHead>Upcoming tasks</TableHead>
                <TableHead>Last email received</TableHead>
                <TableHead>Important notes</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Vendors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snaps.map((s) => (
                <GridRow
                  key={s.wedding.id}
                  s={s}
                  today={today}
                  onOpen={() => navigate({ to: "/weddings/$weddingId", params: { weddingId: s.wedding.id } })}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function TileLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn("block rounded-xl hover-lift focus-visible:outline-2 focus-visible:outline-ring", className)}>
      {children}
    </Link>
  );
}

/* ---------- hero --------------------------------------------------------------------- */

function Hero({ s, also, today }: { s: WeddingSnapshot; also: WeddingSnapshot[]; today: string }) {
  const w = s.wedding;
  const days = daysUntil(w, today);
  const feeState = rollupState(s.fee, s.fee.count);
  return (
    <section className="fade-up rounded-xl bg-card p-5 elevate sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <PhaseChip phase={weddingPhase(w, today)} />
            <span>{dateLong(w.date)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <WeddingLink weddingId={w.id}>
              <CoupleName className="text-3xl sm:text-4xl">{w.title}</CoupleName>
            </WeddingLink>
            <span className="text-lg font-semibold text-primary">{countdownLabel(days)}</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {[s.venue?.name, w.city].filter(Boolean).join(" · ") || "—"}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <HeroFact label="Open tasks" tab="checklist" weddingId={w.id}>
              <span className="tabular-nums">{s.openTasks.length}</span>
              {s.overdueTasks > 0 && <span className="block text-sm font-medium text-red-600 sm:ml-1.5 sm:inline dark:text-red-400">{s.overdueTasks} overdue</span>}
            </HeroFact>
            <HeroFact label="Owed to vendors" tab="budget" weddingId={w.id}>
              <span className="tabular-nums">{s.vendorPay.outstanding ? money(s.vendorPay.outstanding) : "—"}</span>
              {s.vendorPay.overdueCount > 0 && <span className="block text-sm font-medium text-red-600 sm:ml-1.5 sm:inline dark:text-red-400">{s.vendorPay.overdueCount} overdue</span>}
            </HeroFact>
            <HeroFact label="RSVPs pending" tab="guests" weddingId={w.id}>
              {s.invited ? (
                <>
                  <span className="tabular-nums">{s.rsvpPending}</span>
                  <span className="text-sm font-normal text-muted-foreground"> / {s.invited}</span>
                </>
              ) : (
                "—"
              )}
            </HeroFact>
            <HeroFact label="Planner fee">
              {feeState ? <PaymentChip state={feeState} /> : "—"}
            </HeroFact>
          </dl>

          {w.rainPlan && (
            <p className="mt-5 flex items-start gap-2 text-sm">
              <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                <span className="font-medium">Rain plan:</span> <span className="text-muted-foreground">{w.rainPlan}</span>
              </span>
            </p>
          )}

          {s.openTasks.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {s.openTasks.slice(0, 3).map((t) => (
                <li key={t.id} className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "w-[4.75rem] shrink-0 whitespace-nowrap text-xs tabular-nums",
                      t.dueDate && t.dueDate < today ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
                    )}
                  >
                    {dateShort(t.dueDate)}
                  </span>
                  <span className="min-w-0 truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5">
            <Button asChild size="sm" variant="outline">
              <Link to="/weddings/$weddingId" params={{ weddingId: w.id }}>
                Open wedding
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {also.length > 0 && (
          <aside className="border-t pt-4 lg:w-64 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="text-xs text-muted-foreground">Also in the next {ATTENTION_DAYS} days</div>
            <ul className="mt-2 space-y-3">
              {also.map((o) => (
                <li key={o.wedding.id}>
                  <WeddingLink weddingId={o.wedding.id}>
                    <CoupleName className="text-lg">{o.wedding.title}</CoupleName>
                  </WeddingLink>
                  <div className="text-xs text-muted-foreground">
                    {dateShort(o.wedding.date)} · {countdownLabel(daysUntil(o.wedding, today))}
                  </div>
                  <div className="mt-0.5 text-xs">
                    {o.openTasks.length} open tasks
                    {o.overdueTasks > 0 && <span className="text-red-600 dark:text-red-400"> · {o.overdueTasks} overdue</span>}
                    {o.vendorPay.overdueCount > 0 && <span className="text-red-600 dark:text-red-400"> · payment overdue</span>}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </section>
  );
}

function HeroFact({
  label,
  children,
  tab,
  weddingId,
}: {
  label: string;
  children: React.ReactNode;
  tab?: "checklist" | "budget" | "guests";
  weddingId?: string;
}) {
  const value = <dd className="mt-0.5 text-xl font-semibold">{children}</dd>;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      {tab && weddingId ? (
        <WeddingLink weddingId={weddingId} tab={tab} className="hover:no-underline [&_dd]:hover:text-primary">
          {value}
        </WeddingLink>
      ) : (
        value
      )}
    </div>
  );
}

/* ---------- the grid ----------------------------------------------------------------- */

function GridRow({ s, today, onOpen }: { s: WeddingSnapshot; today: string; onOpen: () => void }) {
  const w = s.wedding;
  const feeState = rollupState(s.fee, s.fee.count);
  const email = s.latestInbound;
  return (
    <TableRow className="cursor-pointer [&>td]:align-top" onClick={onOpen}>
      <TableCell>
        <CoupleName className="text-base">{w.title}</CoupleName>
        <div className="text-xs text-muted-foreground">
          {dateShort(w.date)} · {countdownLabel(daysUntil(w, today))}
        </div>
      </TableCell>

      <TableCell className="min-w-56">
        {s.openTasks.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <WeddingLink weddingId={w.id} tab="checklist" stop className="block hover:no-underline">
            <ul className="space-y-0.5">
              {s.openTasks.slice(0, 3).map((t) => (
                <li key={t.id} className="flex max-w-64 gap-1">
                  <span
                    className={cn(
                      "w-[4.75rem] shrink-0 whitespace-nowrap text-xs tabular-nums leading-5",
                      t.dueDate && t.dueDate < today ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground",
                    )}
                  >
                    {dateShort(t.dueDate)}
                  </span>
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ul>
            <div className="mt-1 text-xs text-muted-foreground">
              {s.openTasks.length} open
              {s.overdueTasks > 0 && <span className="text-red-600 dark:text-red-400"> · {s.overdueTasks} overdue</span>}
            </div>
          </WeddingLink>
        )}
      </TableCell>

      <TableCell className="min-w-48">
        {email ? (
          <Link to="/inbox" onClick={(e) => e.stopPropagation()} className="block max-w-56">
            <div className="flex items-center gap-1.5">
              {!email.read && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary">
                  <span className="sr-only">Unread</span>
                </span>
              )}
              <span className={cn("truncate", !email.read && "font-medium")}>{email.fromName}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relativeTime(email.sentAt)}</span>
            </div>
            <div className="truncate text-xs text-muted-foreground">{email.subject}</div>
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="min-w-44 max-w-56 whitespace-normal">
        {w.importantNotes ? (
          <p className="line-clamp-3 text-xs leading-5">{w.importantNotes}</p>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-col items-start gap-1">
          {s.client ? <ClientStatusChip status={s.client.status} /> : <span className="text-muted-foreground">—</span>}
          {feeState && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              Fee <PaymentChip state={feeState} />
              <span className="tabular-nums">
                {s.fee.paidCount}/{s.fee.count}
              </span>
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <WeddingLink weddingId={w.id} tab="vendors" stop className="block hover:no-underline">
          {s.activeVendors ? (
            <div className="tabular-nums">
              {s.bookedVendors}/{s.activeVendors} <span className="text-muted-foreground">booked</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {s.vendorPay.overdueCount > 0 && (
            <div className="mt-0.5 text-xs font-medium tabular-nums text-red-600 dark:text-red-400">
              {money(s.vendorPay.overdue)} overdue
            </div>
          )}
        </WeddingLink>
      </TableCell>
    </TableRow>
  );
}
