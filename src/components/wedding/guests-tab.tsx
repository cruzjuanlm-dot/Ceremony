import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@libretto-ui/button";
import { Input } from "@libretto-ui/input";
import { SegmentedControl } from "@libretto-ui/segmented-control";

import { Chip, EmptyState, Meter, Panel, StatTile } from "~/components/kit";
import { useRemove, useUpdate, useWeddingRows, useWorkspace } from "~/data/hooks";
import type { Guest, MealChoice, RsvpStatus, Wedding } from "~/data/types";
import { guestSummary } from "~/lib/finance";
import { dateLong, pct } from "~/lib/format";
import { MEAL_LABEL } from "~/lib/wedding";
import { cn } from "~/shared/libretto";

import { AddGuestButton } from "./guests/add-guest-dialog";
import { fullName, sideLabels } from "./guests/couple";
import { GuestTable } from "./guests/guest-table";
import { Seating } from "./guests/seating";

type RsvpLens = "all" | RsvpStatus;
type View = "guests" | "tables";

export function GuestsTab({ wedding }: { wedding: Wedding }) {
  const plan = useWorkspace().plan;
  const guests = useWeddingRows("guests", wedding.id);
  const { mutate: update } = useUpdate("guests");
  const { mutate: remove } = useRemove("guests");

  const [view, setView] = useState<View>("guests");
  const [lens, setLens] = useState<RsvpLens>("all");
  const [bOnly, setBOnly] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const sideLabel = useMemo(() => sideLabels(wedding.title), [wedding.title]);
  const summary = guestSummary(guests);

  const onPatch = useCallback((id: string, patch: Partial<Guest>) => update({ id, patch }), [update]);
  const onRemove = useCallback((id: string) => remove(id), [remove]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return guests.filter((g) => {
      if (lens !== "all" && g.rsvp !== lens) return false;
      if (bOnly && g.list !== "B") return false;
      if (!q) return true;
      return `${fullName(g)} ${g.household} ${g.role} ${g.dietary}`.toLowerCase().includes(q);
    });
  }, [guests, lens, bOnly, deferredQuery]);

  const households = useMemo(() => [...new Set(guests.map((g) => g.household))].sort(), [guests]);
  const party = guests.filter((g) => g.role.trim());

  const counts = {
    a: guests.filter((g) => g.list === "A").length,
    b: guests.filter((g) => g.list === "B").length,
    p1: guests.filter((g) => g.side === "partner1").length,
    p2: guests.filter((g) => g.side === "partner2").length,
    both: guests.filter((g) => g.side === "both").length,
  };

  const addButton = <AddGuestButton wedding={wedding} sideLabel={sideLabel} households={households} />;

  if (guests.length === 0) {
    return (
      <EmptyState title="No guests yet" action={addButton}>
        {plan === "pro"
          ? `Add the couple’s guests by household — about ${wedding.guestEstimate} expected.`
          : `Add your guests by household — you’re expecting about ${wedding.guestEstimate}.`}
      </EmptyState>
    );
  }

  const responded = summary.attending + summary.declined;
  const mealsChosen = Object.values(summary.meals).reduce((s, n) => s + n, 0);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      {/* Hero — where the RSVPs stand */}
      <section className="rounded-xl bg-card px-5 py-4 elevate">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">RSVPs</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn("text-4xl font-semibold tabular-nums", summary.attending > 0 && "text-emerald-600 dark:text-emerald-400")}>{summary.attending}</span>
              <span className="text-sm text-muted-foreground">attending of {summary.invited} invited</span>
            </div>
          </div>
          <dl className="flex gap-6 text-sm">
            <HeroStat label="Declined" value={summary.declined} className={summary.declined ? "text-red-600 dark:text-red-400" : undefined} />
            <HeroStat label="Awaiting" value={summary.pending} className={summary.pending ? "text-amber-600 dark:text-amber-400" : undefined} />
            <HeroStat label="Seats needed" value={summary.seats} />
          </dl>
        </div>
        <Meter className="mt-4" value={responded} max={summary.invited} tone="good" label="Share of guests who have replied" />
        <div className="mt-1.5 text-xs text-muted-foreground">{pct(summary.invited ? responded / summary.invited : 0)} replied</div>
      </section>

      {/* Supporting */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Meals"
          value={mealsChosen}
          sub={
            Object.keys(summary.meals).length
              ? (Object.keys(MEAL_LABEL) as MealChoice[])
                  .filter((m) => summary.meals[m])
                  .map((m) => `${MEAL_LABEL[m]} ${summary.meals[m]}`)
                  .join(" · ")
              : "No meals chosen yet"
          }
        />
        <StatTile label="Dietary needs" value={summary.dietary} tone={summary.dietary ? "warn" : undefined} sub="Attending guests" />
        <StatTile label="A list / B list" value={`${counts.a} / ${counts.b}`} />
        <StatTile
          label="Sides"
          value={`${counts.p1} / ${counts.p2}`}
          sub={`${sideLabel.partner1} · ${sideLabel.partner2}${counts.both ? ` · ${counts.both} both` : ""}`}
        />
      </div>

      {/* Detail — the list, or the tables */}
      <section className="grid min-w-0 grid-cols-1 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            aria-label="Guest view"
            value={view}
            onValueChange={setView}
            options={[
              { value: "guests", label: "Guests" },
              { value: "tables", label: "Tables" },
            ]}
          />
          {view === "guests" && (
            <>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search guests"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-8 pl-8"
                />
              </div>
              <SegmentedControl
                aria-label="RSVP filter"
                value={lens}
                onValueChange={setLens}
                options={[
                  { value: "all", label: "All" },
                  { value: "attending", label: "Attending" },
                  { value: "pending", label: "Awaiting" },
                  { value: "declined", label: "Declined" },
                ]}
              />
              <Button
                size="sm"
                variant={bOnly ? "secondary" : "ghost"}
                aria-pressed={bOnly}
                onClick={() => setBOnly((v) => !v)}
                className={cn(bOnly && "ring-1 ring-border")}
              >
                B list
              </Button>
            </>
          )}
          <div className="ml-auto">{addButton}</div>
        </div>

        {view === "tables" ? (
          <Seating guests={guests} onPatch={onPatch} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No guests match.</p>
        ) : (
          <GuestTable guests={filtered} sideLabel={sideLabel} onPatch={onPatch} onRemove={onRemove} />
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Wedding party" subtitle={party.length ? `${party.length} people` : undefined}>
          {party.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {party.map((g) => (
                <li key={g.id}>
                  <Chip tone="brand" className="font-normal">
                    <span className="font-medium">{fullName(g)}</span>
                    <span className="ml-1 opacity-75">· {g.role}</span>
                  </Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Give a guest a role to list them here.</p>
          )}
        </Panel>
        <CatererCount wedding={wedding} guests={guests} />
      </div>
    </div>
  );
}

function HeroStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-semibold tabular-nums", className)}>{value}</dd>
    </div>
  );
}

/** What the caterer needs: meals per type + every dietary note, copyable as plain text. */
function CatererCount({ wedding, guests }: { wedding: Wedding; guests: Guest[] }) {
  const summary = guestSummary(guests);
  const attending = guests.filter((g) => g.rsvp === "attending");
  const notes = attending.filter((g) => g.dietary.trim());
  const meals = (Object.keys(MEAL_LABEL) as MealChoice[]).map((m) => [m, summary.meals[m] ?? 0] as const);
  const unchosen = summary.attending - meals.reduce((s, [, n]) => s + n, 0);

  function copy() {
    const lines = [
      `${wedding.title} — ${dateLong(wedding.date)}`,
      `Headcount: ${summary.seats}`,
      "",
      ...meals.filter(([, n]) => n).map(([m, n]) => `${MEAL_LABEL[m]}: ${n}`),
      ...(unchosen ? [`No meal chosen: ${unchosen}`] : []),
      ...(notes.length
        ? ["", "Dietary notes:", ...notes.map((g) => `- ${fullName(g)}${g.table != null ? ` (table ${g.table})` : ""}: ${g.dietary}`)]
        : []),
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success("Caterer summary copied"))
      .catch(() => toast.error("Couldn’t copy — your browser blocked clipboard access"));
  }

  return (
    <Panel
      title="Caterer count"
      subtitle={`${summary.seats} seats`}
      actions={
        <Button size="sm" variant="outline" onClick={copy} className="no-print">
          <Copy />
          Copy summary
        </Button>
      }
    >
      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
        {meals.map(([m, n]) => (
          <div key={m}>
            <dt className="text-xs text-muted-foreground">{MEAL_LABEL[m]}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-muted-foreground">Not chosen</dt>
          <dd className={cn("text-lg font-semibold tabular-nums", unchosen ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
            {unchosen}
          </dd>
        </div>
      </dl>
      {notes.length > 0 && (
        <ul className="mt-3 grid gap-1 border-t pt-3 text-sm">
          {notes.map((g) => (
            <li key={g.id} className="flex justify-between gap-2">
              <span>
                {fullName(g)}
                {g.table != null && <span className="ml-1.5 text-xs text-muted-foreground">Table {g.table}</span>}
              </span>
              <span className="text-amber-700 dark:text-amber-400">{g.dietary}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
