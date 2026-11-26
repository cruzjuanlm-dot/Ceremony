import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert } from "~/data/hooks";
import type { SubEvent, TimelineSegment, Wedding } from "~/data/types";
import { SEGMENT_LABEL, subEventIdForKind, subEventKindForSegment } from "~/lib/wedding";

import { SubEventSelect } from "../sub-events";
import { DEFAULT_CEREMONY, SEGMENT_ORDER } from "./run-of-show";
import { parseTime } from "./time";

export function AddTimelineItemButton({
  wedding,
  subEvents,
  eventFilter = "all",
}: {
  wedding: Wedding;
  subEvents: SubEvent[];
  eventFilter?: string;
}) {
  const [open, setOpen] = useState(false);
  const insert = useInsert("timeline");
  const linked = (segment: TimelineSegment) =>
    eventFilter === "none"
      ? null
      : eventFilter !== "all"
        ? eventFilter
        : subEventIdForKind(subEventKindForSegment(segment), subEvents);
  const blank = () => ({
    time: wedding.ceremonyTime ?? DEFAULT_CEREMONY,
    duration: "30",
    title: "",
    segment: "reception" as TimelineSegment,
    location: "",
    owner: "",
    subEventId: linked("reception"),
  });
  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const time = parseTime(form.time);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !time) return;
    await insert.mutateAsync({
      weddingId: wedding.id,
      time,
      durationMin: Math.max(0, Math.trunc(Number(form.duration) || 0)),
      title: form.title.trim(),
      segment: form.segment,
      location: form.location.trim(),
      owner: form.owner.trim(),
      notes: "",
      subEventId: form.subEventId,
    });
    setForm(blank());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="at-title">What</Label>
            <Input id="at-title" autoFocus placeholder="Bouquet toss" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="at-time">Time</Label>
              <Input
                id="at-time"
                value={form.time}
                aria-invalid={!time}
                onChange={(e) => set("time", e.target.value)}
                className={!time ? "border-red-500" : undefined}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-dur">Minutes</Label>
              <Input id="at-dur" inputMode="numeric" value={form.duration} onChange={(e) => set("duration", e.target.value.replace(/[^\d]/g, ""))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Part</Label>
              <Select
                value={form.segment}
                onValueChange={(v) => {
                  const segment = v as TimelineSegment;
                  setForm((f) => ({
                    ...f,
                    segment,
                    subEventId: eventFilter === "all" ? subEventIdForKind(subEventKindForSegment(segment), subEvents) : f.subEventId,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEGMENT_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="at-where">Where</Label>
              <Input id="at-where" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="at-who">Who</Label>
              <Input id="at-who" value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            </div>
          </div>
          {subEvents.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Sub-event</Label>
              <SubEventSelect
                events={subEvents}
                value={form.subEventId}
                ariaLabel="Sub-event"
                onChange={(subEventId) => set("subEventId", subEventId)}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!form.title.trim() || !time || insert.isPending}>
              Add item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
