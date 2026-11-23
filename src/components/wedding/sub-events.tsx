import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@libretto-ui/alert-dialog";
import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { SegmentedControl } from "@libretto-ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { Panel } from "~/components/kit";
import { useInsert, useRemove, useUpdate, useWeddingRows } from "~/data/hooks";
import type { SubEvent, SubEventKind, Wedding } from "~/data/types";
import { dateShort, time12 } from "~/lib/format";
import { SUB_EVENT_LABEL, SUB_EVENT_ORDER } from "~/lib/wedding";
import { CellText, GhostSelect } from "./fields";

export function matchesSubEvent(subEventId: string | null, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "none") return subEventId == null;
  return subEventId === filter;
}

export function sortSubEvents(events: readonly SubEvent[]): SubEvent[] {
  return [...events].sort((a, b) => {
    const byDate = (a.date ?? "9999-99-99").localeCompare(b.date ?? "9999-99-99");
    if (byDate !== 0) return byDate;
    const byTime = (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
    if (byTime !== 0) return byTime;
    return SUB_EVENT_ORDER.indexOf(a.kind) - SUB_EVENT_ORDER.indexOf(b.kind);
  });
}

function optionLabel(event: SubEvent, events: readonly SubEvent[]): string {
  const base = SUB_EVENT_LABEL[event.kind];
  const duplicates = events.filter((e) => e.kind === event.kind).length > 1;
  if (!duplicates || !event.date) return base;
  return `${base} · ${dateShort(event.date)}`;
}

export function SubEventFilter({
  events,
  value,
  onChange,
}: {
  events: readonly SubEvent[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (events.length === 0) return null;
  const sorted = sortSubEvents(events);
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <SegmentedControl
        aria-label="Which sub-event"
        className="w-max"
        value={value}
        onValueChange={onChange}
        options={[
          { value: "all", label: "All" },
          ...sorted.map((e) => ({ value: e.id, label: optionLabel(e, events) })),
          { value: "none", label: "Unassigned" },
        ]}
      />
    </div>
  );
}

export function SubEventSelect({
  events,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  events: readonly SubEvent[];
  value: string | null;
  onChange: (id: string | null) => void;
  ariaLabel: string;
  className?: string;
}) {
  if (events.length === 0) return null;
  const sorted = sortSubEvents(events);
  return (
    <GhostSelect
      ariaLabel={ariaLabel}
      className={className}
      value={value && events.some((e) => e.id === value) ? value : "none"}
      onChange={(next) => onChange(next === "none" ? null : next)}
      options={[
        { value: "none", label: "—" },
        ...sorted.map((e) => ({ value: e.id, label: optionLabel(e, events) })),
      ]}
    />
  );
}

const KIND_OPTIONS = SUB_EVENT_ORDER.map((kind) => ({ value: kind, label: SUB_EVENT_LABEL[kind] }));

/** The weekend, on the wedding overview. Pro and DIY use the same list. */
export function SubEventsPanel({ wedding }: { wedding: Wedding }) {
  const events = sortSubEvents(useWeddingRows("subEvents", wedding.id));
  const lines = useWeddingRows("budgetLines", wedding.id);
  const bookings = useWeddingRows("bookings", wedding.id);
  const timeline = useWeddingRows("timeline", wedding.id);
  const update = useUpdate("subEvents");
  const updateLine = useUpdate("budgetLines");
  const updateBooking = useUpdate("bookings");
  const updateTimeline = useUpdate("timeline");
  const remove = useRemove("subEvents");
  const [pending, setPending] = useState<SubEvent | null>(null);

  const save = (id: string, patch: Partial<SubEvent>) => update.mutate({ id, patch });

  async function confirmRemove() {
    const event = pending;
    setPending(null);
    if (!event) return;
    await Promise.all([
      ...lines
        .filter((l) => l.subEventId === event.id)
        .map((l) => updateLine.mutateAsync({ id: l.id, patch: { subEventId: null } })),
      ...bookings
        .filter((b) => b.subEventId === event.id)
        .map((b) => updateBooking.mutateAsync({ id: b.id, patch: { subEventId: null } })),
      ...timeline
        .filter((t) => t.subEventId === event.id)
        .map((t) => updateTimeline.mutateAsync({ id: t.id, patch: { subEventId: null } })),
    ]);
    await remove.mutateAsync(event.id);
  }

  return (
    <Panel
      title="Sub-events"
      subtitle="Date, time, and place for each part of the weekend."
      actions={<AddSubEventButton wedding={wedding} events={events} />}
      bodyClassName="px-2 py-1 sm:px-4"
    >
      {events.length === 0 ? (
        <p className="px-2 py-4 text-sm text-muted-foreground">
          No sub-events yet. Add a welcome party, rehearsal, or brunch when this wedding has one.
        </p>
      ) : (
        <ul>
          {events.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-2 items-end gap-x-3 gap-y-2 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[9rem_9rem_7rem_minmax(0,1fr)_auto]"
            >
              <GhostSelect
                ariaLabel={`Kind for ${SUB_EVENT_LABEL[e.kind]}`}
                value={e.kind}
                options={KIND_OPTIONS}
                onChange={(kind) => save(e.id, { kind })}
                className="col-span-2 sm:col-span-1"
              />
              <div>
                <div className="px-2 text-xs text-muted-foreground">Date</div>
                <CellText
                  type="date"
                  ariaLabel={`Date for ${SUB_EVENT_LABEL[e.kind]}`}
                  value={e.date ?? ""}
                  display={dateShort(e.date)}
                  onCommit={(v) => save(e.id, { date: v || null })}
                />
              </div>
              <div>
                <div className="px-2 text-xs text-muted-foreground">Time</div>
                <CellText
                  type="time"
                  ariaLabel={`Time for ${SUB_EVENT_LABEL[e.kind]}`}
                  value={e.time ?? ""}
                  display={time12(e.time)}
                  onCommit={(v) => save(e.id, { time: v || null })}
                />
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <div className="px-2 text-xs text-muted-foreground">Location</div>
                <CellText
                  ariaLabel={`Location for ${SUB_EVENT_LABEL[e.kind]}`}
                  placeholder="Add a place"
                  value={e.location}
                  onCommit={(location) => save(e.id, { location })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${SUB_EVENT_LABEL[e.kind]}`}
                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={() => setPending(e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={pending != null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pending ? SUB_EVENT_LABEL[pending.kind].toLowerCase() : "sub-event"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Budget lines, vendors, and timeline items that pointed here go back to the whole wedding. Nothing is deleted with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRemove()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}

function AddSubEventButton({ wedding, events }: { wedding: Wedding; events: readonly SubEvent[] }) {
  const [open, setOpen] = useState(false);
  const insert = useInsert("subEvents");
  const used = new Set(events.map((e) => e.kind));
  const [kind, setKind] = useState<SubEventKind>(SUB_EVENT_ORDER.find((k) => !used.has(k)) ?? "welcome");
  const [date, setDate] = useState(wedding.date ?? "");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  function openChange(next: boolean) {
    if (next) {
      const taken = new Set(events.map((e) => e.kind));
      setKind(SUB_EVENT_ORDER.find((k) => !taken.has(k)) ?? "welcome");
      setDate(wedding.date ?? "");
      setTime("");
      setLocation("");
    }
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await insert.mutateAsync({
      weddingId: wedding.id,
      kind,
      date: date || null,
      time: time || null,
      location: location.trim(),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Add sub-event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add sub-event</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as SubEventKind)}>
              <SelectTrigger aria-label="Kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUB_EVENT_ORDER.map((k) => (
                  <SelectItem key={k} value={k}>
                    {SUB_EVENT_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="se-date">Date</Label>
              <Input id="se-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="se-time">Time</Label>
              <Input id="se-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="se-where">Location</Label>
            <Input id="se-where" value={location} placeholder="Parish, terrace, hotel restaurant" onChange={(e) => setLocation(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={insert.isPending}>
              Add sub-event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
