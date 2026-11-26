import { memo, useCallback, useState } from "react";
import { Printer, Trash2 } from "lucide-react";

import { Button } from "@libretto-ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSectionRow,
} from "@libretto-ui/table";

import { Chip, EmptyState } from "~/components/kit";
import { useInsert, useRemove, useRows, useUpdate, useWeddingRows } from "~/data/hooks";
import type { SubEvent, TimelineItem, Wedding } from "~/data/types";
import { dateLong, time12 } from "~/lib/format";
import { SEGMENT_LABEL, subEventIdForKind, subEventKindForSegment, VENDOR_CATEGORY_LABEL } from "~/lib/wedding";
import { cellActionClass, cn } from "~/shared/libretto";

import { CellInt, CellSelect, CellText, CellTime } from "./guests/cells";
import { matchesSubEvent, SubEventFilter, SubEventSelect } from "./sub-events";
import { AddTimelineItemButton } from "./timeline/add-item-dialog";
import { DEFAULT_CEREMONY, SEGMENT_ORDER, endTime, findOverlaps, segmentRuns, sortByTime, templateItems } from "./timeline/run-of-show";
import { toMin } from "./timeline/time";

const SEGMENT_OPTIONS = SEGMENT_ORDER.map((s) => ({ value: s, label: SEGMENT_LABEL[s] }));

export function TimelineTab({ wedding }: { wedding: Wedding }) {
  const items = useWeddingRows("timeline", wedding.id);
  const subEvents = useWeddingRows("subEvents", wedding.id);
  const insert = useInsert("timeline");
  const { mutate: update } = useUpdate("timeline");
  const { mutate: remove } = useRemove("timeline");
  const [seeding, setSeeding] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");

  const onPatch = useCallback((id: string, patch: Partial<TimelineItem>) => update({ id, patch }), [update]);
  const onRemove = useCallback((id: string) => remove(id), [remove]);

  async function startFromTemplate() {
    setSeeding(true);
    try {
      for (const row of templateItems(wedding.id, wedding.ceremonyTime)) {
        await insert.mutateAsync({
          ...row,
          subEventId: subEventIdForKind(subEventKindForSegment(row.segment), subEvents),
        });
      }
    } finally {
      setSeeding(false);
    }
  }

  const ceremony = wedding.ceremonyTime ?? null;

  const visible = items.filter((it) => matchesSubEvent(it.subEventId, eventFilter));

  if (items.length === 0) {
    return (
      <div className="grid min-w-0 grid-cols-1 gap-6">
        <SubEventFilter events={subEvents} value={eventFilter} onChange={setEventFilter} />
        <EmptyState
          title="No timeline yet"
          action={
            <div className="flex gap-2">
              <Button onClick={startFromTemplate} disabled={seeding}>
                Start from template
              </Button>
              <AddTimelineItemButton wedding={wedding} subEvents={subEvents} />
            </div>
          }
        >
          {`Built around the ${time12(ceremony ?? DEFAULT_CEREMONY)} ceremony.`}
        </EmptyState>
        <CallSheet wedding={wedding} eventFilter={eventFilter} />
      </div>
    );
  }

  const allSorted = sortByTime(items);
  const overlaps = findOverlaps(allSorted);
  const sorted = sortByTime(visible);
  const runs = segmentRuns(sorted);
  const first = allSorted[0];
  const last = allSorted.reduce((a, b) => (toMin(endTime(b)) > toMin(endTime(a)) ? b : a), allSorted[0]);
  const showEvent = subEvents.length > 0;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      {/* Hero — the ceremony anchor and the shape of the day */}
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-card px-5 py-4 elevate">
        <div>
          <div className="text-xs text-muted-foreground">Ceremony</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-primary">{time12(ceremony)}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {dateLong(wedding.date)} · {time12(first.time)}–{time12(endTime(last))} · {items.length} items
          </div>
        </div>
        <div className="no-print flex gap-2">
          <AddTimelineItemButton wedding={wedding} subEvents={subEvents} eventFilter={eventFilter} />
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer />
            Print day sheet
          </Button>
        </div>
      </section>

      <SubEventFilter events={subEvents} value={eventFilter} onChange={setEventFilter} />

      <div className="hidden print-show">
        <h1 className="text-xl font-semibold">{wedding.title} — Day sheet</h1>
        <p className="text-sm">
          {dateLong(wedding.date)} · Ceremony {time12(ceremony)} · {wedding.city}
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing on the timeline for this sub-event.</p>
      ) : (
      <Table className="min-w-[1120px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Time</TableHead>
            <TableHead numeric className="w-16">
              Min
            </TableHead>
            <TableHead className="w-20">Ends</TableHead>
            <TableHead className="w-80">What</TableHead>
            <TableHead className="w-36">Where</TableHead>
            <TableHead className="w-36">Who</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-36">Part</TableHead>
            {showEvent && <TableHead className="w-36">Event</TableHead>}
            <TableHead className="w-10">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <SegmentRun key={run.items[0].id} label={SEGMENT_LABEL[run.segment]} columns={showEvent ? 10 : 9}>
              {run.items.map((it) => (
                <TimelineRow
                  key={it.id}
                  item={it}
                  subEvents={subEvents}
                  isCeremony={it.time === ceremony && it.segment === "ceremony"}
                  overlapsWith={overlaps.get(it.id)}
                  onPatch={onPatch}
                  onRemove={onRemove}
                />
              ))}
            </SegmentRun>
          ))}
        </TableBody>
      </Table>
      )}

      <CallSheet wedding={wedding} eventFilter={eventFilter} />
    </div>
  );
}

function SegmentRun({ label, columns, children }: { label: string; columns: number; children: React.ReactNode }) {
  return (
    <>
      <TableSectionRow>
        <td colSpan={columns} className="px-2 text-sm font-semibold">
          {label}
        </td>
      </TableSectionRow>
      {children}
    </>
  );
}

const TimelineRow = memo(function TimelineRow({
  item: it,
  subEvents,
  isCeremony,
  overlapsWith,
  onPatch,
  onRemove,
}: {
  item: TimelineItem;
  subEvents: SubEvent[];
  isCeremony: boolean;
  overlapsWith?: string[];
  onPatch: (id: string, patch: Partial<TimelineItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <TableRow className={isCeremony ? "bg-accent/40" : undefined}>
      <TableCell className="py-1">
        <CellTime ariaLabel={`Start time for ${it.title}`} value={it.time} className={cn(isCeremony && "font-semibold text-primary")} onCommit={(t) => t && onPatch(it.id, { time: t })} />
      </TableCell>
      <TableCell numeric className="py-1">
        <CellInt ariaLabel={`Minutes for ${it.title}`} value={it.durationMin} onCommit={(d) => onPatch(it.id, { durationMin: d ?? 0 })} />
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">{it.durationMin ? time12(endTime(it)) : "—"}</TableCell>
      <TableCell className="py-1">
        <div className="flex items-center gap-1.5">
          <CellText ariaLabel="What" value={it.title} className={cn(isCeremony && "font-semibold")} onCommit={(title) => title && onPatch(it.id, { title })} />
          {overlapsWith && (
            <span title={`Same place, same time as: ${overlapsWith.join(", ")}`}>
              <Chip tone="warn" className="shrink-0">
                Overlaps
              </Chip>
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-1">
        <CellText ariaLabel={`Where for ${it.title}`} value={it.location} onCommit={(location) => onPatch(it.id, { location })} />
      </TableCell>
      <TableCell className="py-1">
        <CellText ariaLabel={`Who for ${it.title}`} value={it.owner} onCommit={(owner) => onPatch(it.id, { owner })} />
      </TableCell>
      <TableCell className="py-1">
        <CellText ariaLabel={`Notes for ${it.title}`} value={it.notes} placeholder="Notes" onCommit={(notes) => onPatch(it.id, { notes })} />
      </TableCell>
      <TableCell className="py-1">
        <CellSelect ariaLabel={`Part of the day for ${it.title}`} value={it.segment} options={SEGMENT_OPTIONS} onChange={(segment) => onPatch(it.id, { segment })} />
      </TableCell>
      {subEvents.length > 0 && (
        <TableCell className="py-1">
          <SubEventSelect
            events={subEvents}
            value={it.subEventId}
            ariaLabel={`Sub-event for ${it.title}`}
            onChange={(subEventId) => onPatch(it.id, { subEventId })}
          />
        </TableCell>
      )}
      <TableCell className="py-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${it.title}`}
          className={cn("no-print h-8 w-8 text-muted-foreground hover:text-red-600", cellActionClass)}
          onClick={() => onRemove(it.id)}
        >
          <Trash2 />
        </Button>
      </TableCell>
    </TableRow>
  );
});

/** Booked vendors in arrival order, with who to call. Arrival is editable here. */
function CallSheet({ wedding, eventFilter }: { wedding: Wedding; eventFilter: string }) {
  const bookings = useWeddingRows("bookings", wedding.id).filter(
    (b) => b.stage === "booked" && matchesSubEvent(b.subEventId, eventFilter),
  );
  const vendors = useRows("vendors");
  const { mutate: update } = useUpdate("bookings");

  const rows = bookings
    .map((b) => ({ b, v: vendors.find((v) => v.id === b.vendorId) }))
    .filter((r): r is { b: typeof r.b; v: NonNullable<typeof r.v> } => r.v != null)
    .sort((x, y) => {
      if (!x.b.arrivalTime) return 1;
      if (!y.b.arrivalTime) return -1;
      return toMin(x.b.arrivalTime) - toMin(y.b.arrivalTime);
    });

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3">
      <h3 className="text-sm font-semibold">
        Vendor call sheet
        {rows.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{rows.length} booked</span>}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No booked vendors yet.</p>
      ) : (
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Arrives</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ b, v }) => (
              <TableRow key={b.id}>
                <TableCell className="py-1">
                  <CellTime allowBlank ariaLabel={`Arrival for ${v.name}`} value={b.arrivalTime} onCommit={(arrivalTime) => update({ id: b.id, patch: { arrivalTime } })} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{VENDOR_CATEGORY_LABEL[v.category]}</div>
                </TableCell>
                <TableCell>{v.contactName || "—"}</TableCell>
                <TableCell className="tabular-nums">
                  {v.phone ? (
                    <a href={`tel:${v.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                      {v.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
