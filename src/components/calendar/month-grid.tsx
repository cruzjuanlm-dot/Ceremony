import { Popover, PopoverContent, PopoverTrigger } from "@libretto-ui/popover";

import { dateLong } from "~/lib/format";
import { cn } from "~/shared/libretto";

import { ItemPill, ItemRow } from "./item-views";
import { monthWeeks, WEEKDAYS, type CalItem } from "./items";

const VISIBLE = 3;

const DOT: Record<CalItem["kind"], string> = {
  wedding: "bg-primary",
  appointment: "bg-accent-foreground/60",
  task: "bg-muted-foreground/50",
  payment: "bg-amber-500",
};

export function MonthGrid({ month, items, today }: { month: string; items: CalItem[]; today: string }) {
  const byDay = new Map<string, CalItem[]>();
  for (const i of items) {
    const list = byDay.get(i.day) ?? [];
    list.push(i);
    byDay.set(i.day, list);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>
      {monthWeeks(month).map((week) => (
        <div key={week[0]} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day) => {
            const list = byDay.get(day) ?? [];
            const inMonth = day.startsWith(month);
            const isToday = day === today;
            const hasWedding = list.some((i) => i.kind === "wedding");
            return (
              <div
                key={day}
                className={cn(
                  "min-h-16 min-w-0 border-r p-1 last:border-r-0 sm:min-h-28",
                  !inMonth && "bg-muted/40",
                  hasWedding && inMonth && "bg-accent/40",
                )}
              >
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "flex w-full items-center justify-between rounded px-1 text-xs hover:bg-muted",
                      !inMonth && "text-muted-foreground",
                    )}
                    aria-label={`${dateLong(day)}, ${list.length} item${list.length === 1 ? "" : "s"}`}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full tabular-nums",
                        isToday && "bg-primary font-semibold text-primary-foreground",
                      )}
                    >
                      {Number(day.slice(8))}
                    </span>
                    {list.length > VISIBLE && (
                      <span className="hidden text-[11px] text-muted-foreground sm:inline">+{list.length - VISIBLE}</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] p-3">
                    <div className="text-sm font-semibold">{dateLong(day)}</div>
                    {list.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">—</p>
                    ) : (
                      <div className="mt-1 max-h-80 divide-y divide-border/60 overflow-y-auto">
                        {list.map((i) => (
                          <ItemRow key={i.id} item={i} today={today} />
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* ≥sm: readable pills. Phone: dots, the day popover carries the detail. */}
                <div className="mt-0.5 hidden space-y-0.5 sm:block">
                  {list.slice(0, VISIBLE).map((i) => (
                    <ItemPill key={i.id} item={i} today={today} />
                  ))}
                </div>
                {list.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden>
                    {list.slice(0, 6).map((i) => (
                      <span key={i.id} className={cn("h-1.5 w-1.5 rounded-full", DOT[i.kind])} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
