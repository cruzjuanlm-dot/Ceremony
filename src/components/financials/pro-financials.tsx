import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@libretto-ui/table";

import { CoupleName, EmptyState, StatTile, toneText } from "~/components/kit";
import { PhoneScrollHint } from "~/components/phone-scroll-hint";
import { PaymentChip } from "~/components/status";
import { useRows } from "~/data/hooks";
import type { Payment } from "~/data/types";
import { addDaysIso, budgetSummary, paymentState, paymentTotals, todayIso } from "~/lib/finance";
import { dateShort, money } from "~/lib/format";
import { cn, PageHeader } from "~/shared/libretto";

import { AddPaymentButton } from "./add-payment-dialog";
import { Hero, HeroFigure } from "./hero";
import { MarkPaidButton } from "./mark-paid-button";

type Ledger = "income" | "vendor";
type Lens = "upcoming" | "overdue" | "paid" | "all";

/**
 * Pro financials: the planner's own fee income and the vendor bills they track for couples.
 * Two ledgers, never netted — they're different businesses' money (ceremony/CLAUDE.md).
 */
export function ProFinancials() {
  const payments = useRows("payments");
  const weddings = useRows("weddings");
  const bookings = useRows("bookings");
  const vendors = useRows("vendors");
  const lines = useRows("budgetLines");
  const [ledger, setLedger] = useState<Ledger>("income");
  const [lens, setLens] = useState<Lens>("upcoming");
  const [weddingId, setWeddingId] = useState<string>("all");
  const today = todayIso();

  const incoming = payments.filter((p) => p.direction === "incoming");
  const outgoing = payments.filter((p) => p.direction === "outgoing");
  const inNow = paymentTotals(incoming, today);
  const outNow = paymentTotals(outgoing, today);

  const scoped = (ledger === "income" ? incoming : outgoing).filter((p) => weddingId === "all" || p.weddingId === weddingId);
  const scopedTotals = paymentTotals(scoped, today);
  const next30 = paymentTotals(
    scoped.filter((p) => !p.paidDate && p.dueDate >= today && p.dueDate <= addDaysIso(today, 30)),
    today,
  );

  const rows = scoped
    .filter((p) => {
      const s = paymentState(p, today);
      if (lens === "upcoming") return s !== "paid";
      if (lens === "overdue") return s === "overdue";
      if (lens === "paid") return s === "paid";
      return true;
    })
    .sort((a, b) => (lens === "paid" ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)));
  const rowTotals = paymentTotals(rows, today);

  const wedding = (id: string) => weddings.find((w) => w.id === id);
  const vendorFor = (p: Payment) => {
    const b = bookings.find((x) => x.id === p.bookingId);
    return b ? vendors.find((v) => v.id === b.vendorId) : undefined;
  };

  const health = weddings
    .filter((w) => w.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .map((w) => ({
      w,
      b: budgetSummary(lines.filter((l) => l.weddingId === w.id), w.budgetTarget),
      paid: paymentTotals(outgoing.filter((p) => p.weddingId === w.id), today).paid,
    }));

  const dueNowSub = (t: typeof inNow) =>
    t.overdueCount ? (
      <span>
        <span className={toneText("bad")}>{money(t.overdue)} overdue</span> · {money(t.dueSoon)} due in 14 days
      </span>
    ) : (
      `Nothing overdue · ${t.dueSoonCount} due in 14 days`
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Financials" actions={<AddPaymentButton defaultDirection={ledger === "income" ? "incoming" : "outgoing"} />} />

      <Hero>
        <div className="mb-4 text-sm font-medium">Due now</div>
        <div className="grid gap-6 sm:grid-cols-2">
          <HeroFigure
            label="Clients owe you"
            value={money(inNow.overdue + inNow.dueSoon)}
            sub={dueNowSub(inNow)}
          />
          <HeroFigure
            label="You owe vendors"
            value={money(outNow.overdue + outNow.dueSoon)}
            sub={dueNowSub(outNow)}
          />
        </div>
      </Hero>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Ledger"
          value={ledger}
          onValueChange={setLedger}
          options={[
            { value: "income", label: "Income" },
            { value: "vendor", label: "Vendor bills" },
          ]}
        />
        <SegmentedControl
          aria-label="Which payments"
          value={lens}
          onValueChange={setLens}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "overdue", label: "Overdue" },
            { value: "paid", label: "Paid" },
            { value: "all", label: "All" },
          ]}
        />
        <Select value={weddingId} onValueChange={setWeddingId}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Wedding">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weddings</SelectItem>
            {weddings.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("mb-6 grid grid-cols-2 gap-3", ledger === "income" ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-5")}>
        <StatTile label={ledger === "income" ? "Received" : "Paid"} value={money(scopedTotals.paid)} tone="good" />
        <StatTile label="Outstanding" value={money(scopedTotals.outstanding)} />
        <StatTile
          label="Overdue"
          value={money(scopedTotals.overdue)}
          tone={scopedTotals.overdueCount ? "bad" : undefined}
          sub={`${scopedTotals.overdueCount} ${scopedTotals.overdueCount === 1 ? "payment" : "payments"}`}
        />
        {ledger === "vendor" && (
          <>
            <StatTile label="Due next 14 days" value={money(scopedTotals.dueSoon)} tone={scopedTotals.dueSoonCount ? "warn" : undefined} />
            <StatTile label="Due next 30 days" value={money(next30.outstanding)} />
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title={lens === "overdue" ? "Nothing overdue" : "No payments here"} className="mb-8" />
      ) : (
        <div className="mb-10">
          <PhoneScrollHint>
          <Table className="min-w-[48rem]">
            <TableHeader>
              <TableRow>
                <TableHead>{ledger === "income" ? "Client" : "Wedding"}</TableHead>
                {ledger === "vendor" && <TableHead>Vendor</TableHead>}
                <TableHead>Payment</TableHead>
                <TableHead>Due</TableHead>
                <TableHead numeric>Amount</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const w = wedding(p.weddingId);
                const s = paymentState(p, today);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {w ? (
                        <Link
                          to="/weddings/$weddingId"
                          params={{ weddingId: w.id }}
                          search={{ tab: ledger === "vendor" ? "vendors" : "budget" } as never}
                          className="hover:underline"
                        >
                          <CoupleName>{w.title}</CoupleName>
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {ledger === "vendor" && <TableCell>{vendorFor(p)?.name ?? "—"}</TableCell>}
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
            <TableFooter>
              <TableRow>
                <TableCell colSpan={ledger === "vendor" ? 4 : 3}>
                  {rows.length} {rows.length === 1 ? "payment" : "payments"}
                </TableCell>
                <TableCell numeric>{money(rowTotals.paid + rowTotals.outstanding)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
          </PhoneScrollHint>
        </div>
      )}

      <h2 className="mb-2 text-base font-semibold">Budget health</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wedding</TableHead>
            <TableHead>Date</TableHead>
            <TableHead numeric>Target</TableHead>
            <TableHead numeric>Projected</TableHead>
            <TableHead numeric>Paid to vendors</TableHead>
            <TableHead numeric>Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {health.map(({ w, b, paid }) => (
            <TableRow key={w.id}>
              <TableCell>
                <Link
                  to="/weddings/$weddingId"
                  params={{ weddingId: w.id }}
                  search={{ tab: "budget" } as never}
                  className="hover:underline"
                >
                  <CoupleName>{w.title}</CoupleName>
                </Link>
              </TableCell>
              <TableCell>{dateShort(w.date)}</TableCell>
              <TableCell numeric className="text-muted-foreground">
                {money(w.budgetTarget)}
              </TableCell>
              <TableCell numeric>{b.projected ? money(b.projected) : "—"}</TableCell>
              <TableCell numeric>{paid ? money(paid) : "—"}</TableCell>
              <TableCell numeric className={b.projected ? toneText(b.overBudget ? "bad" : "good") : undefined}>
                {b.projected ? (
                  <>
                    {money(b.remaining)}
                    <span className="sr-only">{b.overBudget ? " over budget" : " under budget"}</span>
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
