import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The app's ONE table format (DESIGN_LANGUAGE §8). Every table — expenses, vendors, schedule,
 * staffing, the list screens — renders through these primitives so density, rules, hover and
 * header treatment cannot drift apart. Before this, the expense grid was a hand-rolled
 * `<table>` and the vendor list was shadcn's, and they disagreed on radius, header fill, row
 * rule, hover tint, padding and vertical alignment.
 *
 * The look (owner call 2026-08-22, superseding the three trialed states — see
 * TABLE_RESTYLE_2026-08-20.md) is the **quiet grid**: shadcn's geometry (no card, no outer
 * border, `h-10` header, `p-2` cells) with the chrome pushed back so data reads first — a
 * `text-muted-foreground` header, `border-border/60` hairlines between rows, full-weight
 * rules only where structure lives (under the header, under a section band, over the
 * footer), hover as the only highlight, and a `bg-muted/50` totals footer. Its second half
 * lives in cell-control-classes.ts: in-cell controls read as text at rest and reveal their
 * affordances on row hover, focus, or touch. Three things depart from stock shadcn and must
 * not be "corrected" back:
 *
 *  1. `border-separate border-spacing-0` and rules drawn on CELLS. Stock puts `border-b` on
 *     the `<tr>`, which does not paint in the separated model — and the separated model is
 *     what lets the expense grid's and income section's `<col>` tint sit beneath the hairline
 *     and under the row hover.
 *  2. `bg-background` on `TableHead`. Stock has no fill; staffing-sheet's sticky first column
 *     has to paint over the cells scrolling under it, and there is no card left to inherit.
 *  3. `TableShell` and `TableSectionRow`, which stock has no equivalent for.
 */

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          // No outer border at all — stock ends the table on its last row rule.
          "w-full caption-bottom border-separate border-spacing-0 text-sm",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

/**
 * The standard title/actions bar above a table. `header` is the optional title/actions row.
 *
 * It used to own a card (`rounded-xl border bg-card`) — that card is gone: the table sits
 * directly on the page. The component stays because it is what keeps the gap between a
 * table and its title from being re-invented per caller.
 */
const TableShell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { header?: React.ReactNode }
>(({ className, header, children, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props}>
    {header != null && <div className="flex items-center justify-between gap-2 pb-3">{header}</div>}
    {children}
  </div>
));
TableShell.displayName = "TableShell";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <thead ref={ref} className={cn(className)} {...props} />);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child>td]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "[&>tr>td]:border-t [&>tr>td]:border-border [&>tr>td]:bg-muted/50 [&>tr>td]:font-medium",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        // Rules live on the CELLS, not the row: with border-separate a row border does not
        // paint, and cell borders are also what lets a <col> tint sit beneath the hairline.
        // Softened to /60 — row dividers separate, they don't frame; the full-weight rules
        // belong to the header, section bands and footer.
        "[&>td]:border-b [&>td]:border-border/60",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

/**
 * A full-width section header inside the body — the expense grid's category bands. It used to
 * be a grey fill; it is now what an accountant would write: the name in semibold with air
 * above it, closed by a full-weight hairline. No fill, and never a double rule.
 */
const TableSectionRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      // Spacing and the rule only — NOT typography. A `[&>td]:text-*` here outranks the
      // cell's own class (descendant selector beats a plain class), which would flatten the
      // expense grid's over/under money colours on the category subtotal.
      "transition-colors [&>td]:border-b [&>td]:border-border [&>td]:pb-1.5 [&>td]:pt-5",
      className,
    )}
    {...props}
  />
));
TableSectionRow.displayName = "TableSectionRow";

type CellProps = { numeric?: boolean };

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & CellProps
>(({ className, numeric, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // Muted, so column labels sit behind the data instead of competing with it — in a
      // grid of editable rows the header was indistinguishable from the rows' own text.
      "h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-muted-foreground",
      // bg is load-bearing for the sticky first column in staffing-sheet — it has to paint
      // over the cells scrolling beneath it, and the table no longer sits on a card.
      "border-b border-border bg-background",
      numeric && "text-right",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & CellProps
>(({ className, numeric, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "whitespace-nowrap p-2 align-middle",
      numeric && "text-right tabular-nums",
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableShell,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableSectionRow,
  TableCell,
  TableCaption,
};
