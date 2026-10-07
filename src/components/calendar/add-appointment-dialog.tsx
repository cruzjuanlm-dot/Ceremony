import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert, useRows, useWorkspace } from "~/data/hooks";
import type { AppointmentKind } from "~/data/types";
import { todayIso } from "~/lib/finance";
import { APPOINTMENT_LABEL } from "~/lib/wedding";

/** "Add appointment" — DESIGN_LANGUAGE §1 (Add) + §3 (several fields → dialog). */
export function AddAppointmentButton() {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const insert = useInsert("appointments");
  const [open, setOpen] = useState(false);
  const blank = () => ({
    title: "",
    kind: "meeting" as AppointmentKind,
    date: todayIso(),
    start: "10:00",
    end: "11:00",
    weddingId: ws.plan === "diy" ? (weddings[0]?.id ?? "") : "",
    location: "",
  });
  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const endBeforeStart = form.end <= form.start;
  const valid = form.title.trim() && form.date && form.start && form.end && !endBeforeStart;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    await insert.mutateAsync({
      title: form.title.trim(),
      kind: form.kind,
      start: new Date(`${form.date}T${form.start}`).toISOString(),
      end: new Date(`${form.date}T${form.end}`).toISOString(),
      weddingId: form.weddingId || null,
      location: form.location.trim(),
    });
    setOpen(false);
    setForm(blank());
  }

  const upcoming = weddings
    .filter((w) => !w.date || w.date >= todayIso())
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm(blank());
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add appointment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ap-title">Title</Label>
            <Input id="ap-title" placeholder="Cake tasting" value={form.title} onChange={(e) => set("title", e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(v) => set("kind", v as AppointmentKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(APPOINTMENT_LABEL) as AppointmentKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {APPOINTMENT_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ap-date">Date</Label>
              <Input id="ap-date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ap-start">Start</Label>
              <Input id="ap-start" type="time" value={form.start} onChange={(e) => set("start", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ap-end">End</Label>
              <Input id="ap-end" type="time" value={form.end} onChange={(e) => set("end", e.target.value)} aria-invalid={endBeforeStart} />
            </div>
          </div>
          {endBeforeStart && <p className="-mt-2 text-xs text-red-600 dark:text-red-400">End time must be after the start.</p>}
          {ws.plan === "pro" && (
            <div className="grid gap-1.5">
              <Label>Wedding</Label>
              <Select value={form.weddingId || "none"} onValueChange={(v) => set("weddingId", v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No wedding</SelectItem>
                  {upcoming.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="ap-loc">Location</Label>
            <Input id="ap-loc" placeholder="Studio, venue, video call…" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!valid || insert.isPending}>
              Add appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
