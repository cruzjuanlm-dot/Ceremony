import { useState, type ReactNode } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

import { Button } from "@libretto-ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSectionRow,
  TableShell,
} from "@libretto-ui/table";

import { EmptyState, StatTile } from "~/components/kit";
import { PaymentChip } from "~/components/status";
import { useInsert, useRemove, useRows, useUpdate, useWeddingRows, useWorkspace } from "~/data/hooks";
import type { BudgetCategory, BudgetLine, Payment, Wedding } from "~/data/types";
import {
  budgetByCategory,
  budgetSummary,
  paymentState,
  paymentTotals,
  todayIso,
} from "~/lib/finance";
import { dateShort, money, pct } from "~/lib/format";
import { cellActionClass, cn } from "~/shared/libretto";

import { CellAmount, CellText, GhostSelect } from "./fields";
import { lineVariance } from "~/lib/finance";
import { BUDGET_CATEGORIES } from "./wedding-helpers";

const PAID_BY = [
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

const DIY_PAID_BY = [
  { value: "couple", label: "Us" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

/** Difference = estimate − actual: positive = under (green), negative = over (red). */
function Variance({ value }: { value: number | null }) {
  if (value == null || value === 0) return <span className="text-muted-foreground">{value === 0 ? money(0) : "—"}</span>;
  return (
    <span className={value < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
      {money(value)}
      <span className="sr-only">{value < 0 ? " over estimate" : " under estimate"}</span>
    </span>
  );
}

export function BudgetTab({ wedding: w }: { wedding: Wedding }) {
  const ws = useWorkspace();
  const today = todayIso();
  const lines = useWeddingRows("budgetLines", w.id);
  const payments = useWeddingRows("payments", w.id);
  const bookings = useWeddingRows("bookings", w.id);
  const vendors = useRows("vendors");
  const updateLine = useUpdate("budgetLines");
  const insertLine = useInsert("budgetLines");
  const removeLine = useRemove("budgetLines");
  const updatePayment = useUpdate("payments");
  const [newCategory, setNewCategory] = useState<BudgetCategory>("Other");

  const summary = budgetSummary(lines, w.budgetTarget);
  const byCat = budgetByCategory(lines);
  // Unpaid first (soonest due on top), then the paid history.
  const byDue = (a: Payment, b: Payment) =>
    Number(a.paidDate != null) - Number(b.paidDate != null) || a.dueDate.localeCompare(b.dueDate);
  const outgoing = payments.filter((p) => p.direction === "outgoing").sort(byDue);
  const incoming = payments.filter((p) => p.direction === "incoming").sort(byDue);
  const out = paymentTotals(outgoing, today);
  const fee = paymentTotals(incoming, today);

  const groups = BUDGET_CATEGORIES.map((category) => ({
    category,
    lines: lines.filter((l) => l.category === category),
    totals: byCat.find((c) => c.category === category),
  })).filter((g) => g.lines.length > 0);

  const save = (id: string, patch: Partial<BudgetLine>) => updateLine.mutate({ id, patch });
  const addLine = (category: BudgetCategory) =>
    insertLine.mutate({
      weddingId: w.id,
      category,
      description: "",
      estimate: null,
      actual: null,
      bookingId: null,
      paidBy: "couple",
    });
  const markPaid = (p: Payment) => updatePayment.mutate({ id: p.id, patch: { paidDate: today } });
  const vendorFor = (p: Payment) => {
    const b = bookings.find((x) => x.id === p.bookingId);
    return b ? vendors.find((v) => v.id === b.vendorId) : undefined;
  };
  const maxCat = byCat[0]?.projected ?? 0;
  const paidByOptions = ws.plan === "diy" ? DIY_PAID_BY : PAID_BY;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Target" value={money(summary.target)} />
        <StatTile
          label="Projected"
          value={money(summary.projected)}
          tone={summary.overBudget ? "bad" : undefined}
          sub={summary.target > 0 ? `${pct(summary.projected / summary.target)} of target` : undefined}
        />
        <StatTile
          label="Paid so far"
          value={money(out.paid)}
          tone={out.paid > 0 ? "good" : undefined}
          sub={out.overdueCount ? <span className="text-red-600 dark:text-red-400">{money(out.overdue)} overdue</span> : `${money(out.outstanding)} scheduled`}
        />
        <StatTile
          label={summary.overBudget ? "Over budget" : "Remaining"}
          value={money(Math.abs(summary.remaining))}
          tone={summary.overBudget ? "bad" : "good"}
        />
      </div>

      <TableShell
        header={
          <>
            <h2 className="text-sm font-semibold">Budget</h2>
            <div className="flex items-center gap-2">
              <GhostSelect
                ariaLabel="Category for new line"
                value={newCategory}
                onChange={setNewCategory}
                options={BUDGET_CATEGORIES.map((c) => ({ value: c, label: c }))}
                className="w-48 [&_select]:border-input"
              />
              <Button size="sm" variant="outline" onClick={() => addLine(newCategory)} disabled={insertLine.isPending}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add line
              </Button>
            </div>
          </>
        }
      >
        {groups.length === 0 ? (
          <EmptyState title="No budget lines yet" action={<Button onClick={() => addLine("Venue & catering")}>Add line</Button>}>
            Start with the venue — it's usually the biggest line.
          </EmptyState>
        ) : (
          <Table className="min-w-[640px]">
            <colgroup>
              <col />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-28" />
              <col className="w-10" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead numeric>Estimate</TableHead>
                <TableHead numeric>Actual</TableHead>
                <TableHead numeric>Difference</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <BudgetGroup key={g.category} category={g.category} totals={g.totals}>
                  {g.lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="py-1">
                        <CellText
                          ariaLabel="Item"
                          placeholder="New item"
                          value={l.description}
                          onCommit={(v) => save(l.id, { description: v })}
                          className="-ml-2 min-w-48"
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <GhostSelect
                          ariaLabel="Paid by"
                          value={l.paidBy}
                          options={paidByOptions}
                          onChange={(v) => save(l.id, { paidBy: v })}
                          className="-ml-2"
                        />
                      </TableCell>
                      <TableCell numeric className="py-1">
                        <CellAmount ariaLabel="Estimate" value={l.estimate} onCommit={(v) => save(l.id, { estimate: v })} />
                      </TableCell>
                      <TableCell numeric className="py-1">
                        <CellAmount ariaLabel="Actual" value={l.actual} onCommit={(v) => save(l.id, { actual: v })} />
                      </TableCell>
                      <TableCell numeric>
                        <Variance value={lineVariance(l)} />
                      </TableCell>
                      <TableCell className="py-1 pl-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${l.description || "line"}`}
                          className={cn("h-8 w-8 text-muted-foreground hover:text-red-600", cellActionClass)}
                          onClick={() => removeLine.mutate(l.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </BudgetGroup>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell numeric>{money(summary.estimate)}</TableCell>
                <TableCell numeric>{money(summary.actual)}</TableCell>
                <TableCell numeric>
                  <Variance value={summary.actual ? summary.estimate - summary.projected : null} />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </TableShell>

      <section>
        <h2 className="pb-3 text-sm font-semibold">By category</h2>
        <CategoryBars rows={byCat} max={maxCat} />
      </section>

      <TableShell header={<h2 className="text-sm font-semibold">Payment schedule</h2>}>
          {outgoing.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendor payments scheduled yet.</p>
          ) : (
            <PaymentsTable
              rows={outgoing}
              today={today}
              who={(p) => vendorFor(p)?.name ?? "—"}
              whoLabel="Vendor"
              onMarkPaid={markPaid}
            />
          )}
      </TableShell>

      {ws.plan === "pro" && (
        <TableShell
          header={
            <>
              <h2 className="text-sm font-semibold">Our fee</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {money(fee.paid)} received · {money(fee.outstanding)} outstanding
              </span>
            </>
          }
        >
          {incoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fee installments scheduled.</p>
          ) : (
            <PaymentsTable rows={incoming} today={today} onMarkPaid={markPaid} />
          )}
        </TableShell>
      )}
    </div>
  );
}

function BudgetGroup({
  category,
  totals,
  children,
}: {
  category: string;
  totals?: { estimate: number; actual: number; projected: number };
  children: ReactNode;
}) {
  return (
    <>
      <TableSectionRow>
        <TableCell colSpan={2} className="font-semibold">
          {category}
        </TableCell>
        <TableCell numeric className="pr-4 text-muted-foreground">
          {totals ? money(totals.estimate) : "—"}
        </TableCell>
        <TableCell numeric className="pr-4 text-muted-foreground">
          {totals?.actual ? money(totals.actual) : "—"}
        </TableCell>
        <TableCell numeric>
          <Variance value={totals?.actual ? totals.estimate - totals.projected : null} />
        </TableCell>
        <TableCell />
      </TableSectionRow>
      {children}
    </>
  );
}

function PaymentsTable({
  rows,
  today,
  who,
  whoLabel,
  onMarkPaid,
}: {
  rows: Payment[];
  today: string;
  who?: (p: Payment) => string;
  whoLabel?: string;
  onMarkPaid: (p: Payment) => void;
}) {
  return (
    <Table className="min-w-[520px]">
      <TableHeader>
        <TableRow>
          {who && <TableHead>{whoLabel}</TableHead>}
          <TableHead>Payment</TableHead>
          <TableHead>Due</TableHead>
          <TableHead numeric>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => {
          const state = paymentState(p, today);
          return (
            <TableRow key={p.id}>
              {who && <TableCell className="max-w-44 truncate font-medium">{who(p)}</TableCell>}
              <TableCell className="max-w-40 truncate">{p.label}</TableCell>
              <TableCell className={cn(state === "overdue" && "text-red-600 dark:text-red-400")}>
                {p.paidDate ? <span className="text-muted-foreground">Paid {dateShort(p.paidDate)}</span> : dateShort(p.dueDate)}
              </TableCell>
              <TableCell numeric>{money(p.amount)}</TableCell>
              <TableCell>
                <PaymentChip state={state} />
              </TableCell>
              <TableCell className="py-1 text-right">
                {!p.paidDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-7 px-2 text-xs", state !== "overdue" && cellActionClass)}
                    onClick={() => onMarkPaid(p)}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Mark paid
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function CategoryBars({ rows, max }: { rows: { category: string; projected: number }[]; max: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
      {rows.map((c) => (
        <li key={c.category} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate">{c.category}</span>
            <span className="tabular-nums text-muted-foreground">{money(c.projected)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-blue-500/70"
              style={{ width: `${max > 0 ? Math.max(2, (c.projected / max) * 100) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
