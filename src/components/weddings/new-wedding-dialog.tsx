import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert, useRows } from "~/data/hooks";
import type { CeremonyType } from "~/data/types";
import { CEREMONY_LABEL } from "~/lib/wedding";

/** "New wedding" (DESIGN_LANGUAGE §1: New = a standalone object; dialog = several fields). */
export function NewWeddingButton() {
  const [open, setOpen] = useState(false);
  const clients = useRows("clients");
  const insert = useInsert("weddings");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    date: "",
    city: "",
    guestEstimate: "120",
    budgetTarget: "40000",
    ceremonyType: "catholic" as CeremonyType,
    clientId: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const w = await insert.mutateAsync({
      title: form.title.trim(),
      clientId: form.clientId || null,
      date: form.date || null,
      ceremonyTime: "17:00",
      venueId: null,
      ceremonyVenueId: null,
      city: form.city.trim(),
      guestEstimate: Number(form.guestEstimate) || 0,
      budgetTarget: Number(form.budgetTarget) || 0,
      ceremonyType: form.ceremonyType,
      destination: false,
      style: "",
      importantNotes: "",
      rainPlan: "",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    navigate({ to: "/weddings/$weddingId", params: { weddingId: w.id } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New wedding
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New wedding</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nw-title">Couple</Label>
            <Input id="nw-title" placeholder="Sofía & Diego" value={form.title} onChange={(e) => set("title")(e.target.value)} autoFocus />
          </div>
          {clients.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Client</Label>
              <Select value={form.clientId || "none"} onValueChange={(v) => set("clientId")(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client yet</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.partner1} & {c.partner2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nw-date">Date</Label>
              <Input id="nw-date" type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nw-city">City</Label>
              <Input id="nw-city" placeholder="San Juan, PR" value={form.city} onChange={(e) => set("city")(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nw-guests">Guest estimate</Label>
              <Input id="nw-guests" inputMode="numeric" value={form.guestEstimate} onChange={(e) => set("guestEstimate")(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nw-budget">Budget target</Label>
              <Input id="nw-budget" inputMode="numeric" value={form.budgetTarget} onChange={(e) => set("budgetTarget")(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Ceremony</Label>
            <Select value={form.ceremonyType} onValueChange={(v) => set("ceremonyType")(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CEREMONY_LABEL) as CeremonyType[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {CEREMONY_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!form.title.trim() || insert.isPending}>
              New wedding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
