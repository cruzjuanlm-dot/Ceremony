import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { EmptyState, Meter, Panel, StatTile, toneText } from "~/components/kit";
import { PaymentChip } from "~/components/status";
import { useRows } from "~/data/hooks";
import type { BudgetLine, Payment, Wedding } from "~/data/types";
import { budgetByCategory, budgetSummary, costPerGuest, guestSummary, paymentState, paymentTotals, todayIso } from "~/lib/finance";
import { dateShort, money, pct } from "~/lib/format";
import { cn, PageHeader } from "~/shared/libretto";

import { AddPaymentButton } from "./add-payment-dialog";
import { Hero } from "./hero";
import { MarkPaidButton } from "./mark-paid-button";

const PAYER_LABEL: Record<BudgetLine["paidBy"], string> = { couple: "Us", family: "Family", other: "Others" };

/** DIY "Budget & payments": the couple's one wedding — where the money stands and what's due next. */
export function DiyFinancials() {
  const weddings = useRows("weddings");
  const w = weddings[0];
  if (!w) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Budget & payments" />
        <EmptyState title="No wedding yet">Add your wedding to start a budget.</EmptyState>
      </div>
    );
  }
  return <DiyBody wedding={w} />;
}

function DiyBody({ wedding: w }: { wedding: Wedding }) {
  const lines = useRows("budgetLines").filter((l) => l.weddingId === w.id);
  const payments = useRows("payments").filter((p) => p.weddingId === w.id && p.direction === "outgoing");
  const guests = useRows("guests").filter((g) => g.weddingId === w.id);
  const bookings = useRows("bookings");
  const vendors = useRows("vendors");
  const today = todayIso();

  const b = budgetSummary(lines, w.budgetTarget);
  const t = paymentTotals(payments, today);
  const g = guestSummary(guests);
  const headcount = g.attending || w.guestEstimate;
  const perGuest = costPerGuest(b.projected, headcount);
  const categories = budgetByCategory(lines);
  const maxCat = Math.max(1, ...categories.map((c) => c.projected));
  const payers = (["couple", "family", "other"] as const)
    .map((k) => ({ k, projected: budgetSummary(lines.filter((l) => l.paidBy === k), 0).projected }))
    .filter((x) => x.projected > 0);

  const schedule = [...payments].sort((a, c) => {
    if (!a.paidDate !== !c.paidDate) return a.paidDate ? 1 : -1;
    return a.paidDate ? c.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(c.dueDate);
  });
  const vendorFor = (p: Payment) => {
    const bk = bookings.find((x) => x.id === p.bookingId);
    return bk ? vendors.find((v) => v.id === bk.vendorId) : undefined;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Budget & payments"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/weddings/$weddingId" params={{ weddingId: w.id }} search={{ tab: "budget" } as never}>
                Budget lines
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <AddPaymentButton weddingId={w.id} />
          </>
        }
      />

      <Hero>
        <div className="text-sm text-muted-foreground">Projected spend</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className={cn("text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl", b.overBudget && toneText("bad"))}>
            {money(b.projected)}
          </span>
          <span className="text-lg text-muted-foreground tabular-nums">of {money(b.target)}</span>
        </div>
        <Meter className="mt-4 h-2" value={b.projected} max={b.target} tone={b.overBudget ? "bad" : "brand"} label="Projected spend against target" />
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
          <span className={toneText(b.overBudget ? "bad" : "good")}>
            {b.overBudget ? `${money(-b.remaining)} over budget` : `${money(b.remaining)} left to plan`}
          </span>
          <span className="text-muted-foreground">{b.target > 0 && `${pct(b.projected / b.target)} of target`}</span>
        </div>
      </Hero>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Paid so far" value={money(t.paid)} tone="good" />
        <StatTile
          label="Still to pay"
          value={money(t.outstanding)}
          sub={t.overdueCount ? <span className={toneText("bad")}>{money(t.overdue)} overdue</span> : `${t.dueSoonCount} due in 14 days`}
        />
        <StatTile
          className="col-span-2 sm:col-span-1"
          label="Cost per guest"
          value={perGuest != null ? money(perGuest) : "—"}
          sub={g.attending ? `${g.attending} attending` : `~${w.guestEstimate} guests estimated`}
        />
      </div>

      <h2 className="mb-2 text-base font-semibold">Payment schedule</h2>
      {schedule.length === 0 ? (
        <EmptyState title="No payments scheduled" className="mb-8" action={<AddPaymentButton weddingId={w.id} />}>
          Add each vendor's deposit and balance so nothing sneaks up on you.
        </EmptyState>
      ) : (
        <div className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Due</TableHead>
                <TableHead numeric>Amount</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((p) => {
                const s = paymentState(p, today);
                return (
                  <TableRow key={p.id} className={cn(s === "paid" && "text-muted-foreground")}>
                    <TableCell className={cn(s !== "paid" && "font-medium")}>{vendorFor(p)?.name ?? "—"}</TableCell>
                    <TableCell>{p.label}</TableCell>
                    <TableCell className={cn(s === "overdue" && toneText("bad"))}>{dateShort(p.dueDate)}</TableCell>
                    <TableCell numeric className={cn(s === "overdue" && toneText("bad"))}>
                      {money(p.amount)}
                    </TableCell>
                    <TableCell>
                      <PaymentChip state={s} />
                    </TableCell>
                    <TableCell className="text-right">
                      <MarkPaidButton payment={p} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel title="Spend by category">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budget lines yet.</p>
          ) : (
            <ul className="grid gap-2.5">
              {categories.map((c) => (
                <li key={c.category} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate">{c.category}</span>
                  <Meter value={c.projected} max={maxCat} tone="info" label={`${c.category} projected`} />
                  <span className="w-20 text-right tabular-nums">{money(c.projected)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Who's paying">
          {payers.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="grid gap-3">
              {payers.map((x) => (
                <li key={x.k} className="grid gap-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span>{PAYER_LABEL[x.k]}</span>
                    <span className="tabular-nums">
                      {money(x.projected)}
                      <span className="ml-1.5 text-muted-foreground">{b.projected > 0 ? pct(x.projected / b.projected) : ""}</span>
                    </span>
                  </div>
                  <Meter value={x.projected} max={b.projected} tone={x.k === "couple" ? "brand" : "muted"} label={`${PAYER_LABEL[x.k]} share`} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
