import type { Guest } from "~/data/types";
import { Chip, EmptyState } from "~/components/kit";
import { cn } from "~/shared/libretto";

import { CellInt } from "./cells";
import { TABLE_SEATS, fullName } from "./couple";
import type { PatchGuest } from "./guest-table";

/** Tables view: a card per table + the attending guests not seated yet. Reassign by number. */
export function Seating({ guests, onPatch }: { guests: Guest[]; onPatch: PatchGuest }) {
  const attending = guests.filter((g) => g.rsvp === "attending");
  const byTable = new Map<number, Guest[]>();
  const unseated: Guest[] = [];
  for (const g of attending) {
    if (g.table == null) unseated.push(g);
    else {
      const list = byTable.get(g.table);
      if (list) list.push(g);
      else byTable.set(g.table, [g]);
    }
  }
  const tables = [...byTable].sort((a, b) => a[0] - b[0]);

  if (attending.length === 0) {
    return <EmptyState title="No one to seat yet">Seating opens up as guests reply “attending”.</EmptyState>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map(([n, seated]) => {
          const over = seated.length > TABLE_SEATS;
          return (
            <section key={n} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <h4 className="text-sm font-semibold">Table {n}</h4>
                <span className={cn("text-xs tabular-nums", over ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                  {seated.length}/{TABLE_SEATS}
                  {over && <span className="sr-only"> — over capacity</span>}
                </span>
              </div>
              <ul className="px-1 py-1">
                {seated.map((g) => (
                  <SeatRow key={g.id} guest={g} onPatch={onPatch} />
                ))}
              </ul>
            </section>
          );
        })}
        {tables.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">No tables yet — give a guest a table number to start one.</p>
        )}
      </div>

      <section className="h-fit rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="text-sm font-semibold">Unseated attending</h4>
          {unseated.length > 0 ? <Chip tone="warn">{unseated.length}</Chip> : <Chip tone="good">All seated</Chip>}
        </div>
        {unseated.length > 0 && (
          <ul className="max-h-[32rem] overflow-y-auto px-1 py-1">
            {unseated.map((g) => (
              <SeatRow key={g.id} guest={g} onPatch={onPatch} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SeatRow({ guest: g, onPatch }: { guest: Guest; onPatch: PatchGuest }) {
  const name = fullName(g);
  return (
    <li className="group flex items-center justify-between gap-2 rounded-md px-2 hover:bg-muted/50">
      <span className="min-w-0 truncate text-sm">
        {name}
        {g.role && <span className="ml-1.5 text-xs text-muted-foreground">{g.role}</span>}
      </span>
      <CellInt
        ariaLabel={`Table for ${name}`}
        value={g.table}
        min={1}
        className="h-7 w-14 shrink-0 group-hover:border-input"
        onCommit={(table) => onPatch(g.id, { table })}
      />
    </li>
  );
}
