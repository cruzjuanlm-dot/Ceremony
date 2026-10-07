import { Checkbox } from "@libretto-ui/checkbox";

import { useUpdate } from "~/data/hooks";
import { addDaysIso, daysBetween } from "~/lib/finance";
import { dateLong } from "~/lib/format";

import { ItemRow } from "./item-views";
import type { CalItem } from "./items";

export const AGENDA_DAYS = 30;

function dayHeading(day: string, today: string) {
  const d = daysBetween(today, day);
  const prefix = d === 0 ? "Today" : d === 1 ? "Tomorrow" : null;
  return prefix ? `${prefix} · ${dateLong(day)}` : dateLong(day);
}

/**
 * Chronological list: anything still open from before today (overdue tasks/payments), then
 * the next 30 days grouped by day. Task checkboxes toggle in place — the one write here.
 */
export function Agenda({ items, today }: { items: CalItem[]; today: string }) {
  const update = useUpdate("tasks");
  const end = addDaysIso(today, AGENDA_DAYS);

  const overdue = items.filter(
    (i) => i.day < today && ((i.kind === "task" && !i.task.done) || (i.kind === "payment" && i.state === "overdue")),
  );
  const groups = new Map<string, CalItem[]>();
  for (const i of items) {
    if (i.day < today || i.day > end) continue;
    const list = groups.get(i.day) ?? [];
    list.push(i);
    groups.set(i.day, list);
  }

  const row = (i: CalItem) => (
    <ItemRow
      key={i.id}
      item={i}
      today={today}
      leading={
        i.kind === "task" ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center">
            <Checkbox
              checked={i.task.done}
              onCheckedChange={(v) => update.mutate({ id: i.task.id, patch: { done: v === true } })}
              aria-label={`Done: ${i.title}`}
            />
          </span>
        ) : undefined
      }
    />
  );

  if (overdue.length === 0 && groups.size === 0) {
    return <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Nothing in the next {AGENDA_DAYS} days.</p>;
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <section>
          <h3 className="border-b pb-1.5 text-sm font-semibold text-red-700 dark:text-red-400">Overdue · {overdue.length}</h3>
          <div className="divide-y divide-border/60">{overdue.map(row)}</div>
        </section>
      )}
      {[...groups.entries()].map(([day, list]) => (
        <section key={day}>
          <h3 className="border-b pb-1.5 text-sm font-semibold">{dayHeading(day, today)}</h3>
          <div className="divide-y divide-border/60">{list.map(row)}</div>
        </section>
      ))}
    </div>
  );
}
