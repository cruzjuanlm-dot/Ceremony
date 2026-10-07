import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert, useWorkspace } from "~/data/hooks";
import type { ServiceLevel } from "~/data/types";
import { todayIso } from "~/lib/finance";
import { SERVICE_LEVEL_LABEL } from "~/lib/wedding";

import { clientName } from "./client-stats";

/** "New client" — the couple as the planner's customer; a wedding date also creates their wedding. */
export function NewClientButton({ onCreated }: { onCreated?: (id: string) => void }) {
  const ws = useWorkspace();
  const insertClient = useInsert("clients");
  const insertWedding = useInsert("weddings");
  const [open, setOpen] = useState(false);
  const blank = () => ({
    partner1: "",
    partner2: "",
    email: "",
    phone: "",
    serviceLevel: "full" as ServiceLevel,
    planningFee: "",
    source: "",
    language: "es" as "en" | "es",
    weddingDate: "",
    city: ws.city,
  });
  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valid = form.partner1.trim().length > 0;
  const pending = insertClient.isPending || insertWedding.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const today = todayIso();
    const c = await insertClient.mutateAsync({
      partner1: form.partner1.trim(),
      partner2: form.partner2.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: "inquiry",
      serviceLevel: form.serviceLevel,
      planningFee: Number(form.planningFee) || 0,
      source: form.source.trim(),
      language: form.language,
      notes: "",
      createdAt: today,
    });
    if (form.weddingDate) {
      await insertWedding.mutateAsync({
        clientId: c.id,
        title: clientName(c),
        date: form.weddingDate,
        ceremonyTime: "17:00",
        venueId: null,
        ceremonyVenueId: null,
        city: form.city.trim(),
        guestEstimate: 120,
        budgetTarget: 40000,
        ceremonyType: "catholic",
        destination: false,
        style: "",
        importantNotes: "",
        rainPlan: "",
        createdAt: today,
      });
    }
    setOpen(false);
    onCreated?.(c.id);
  }

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
          New client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nc-p1">Partner</Label>
              <Input id="nc-p1" placeholder="Sofía" value={form.partner1} onChange={(e) => set("partner1", e.target.value)} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-p2">Partner</Label>
              <Input id="nc-p2" placeholder="Diego" value={form.partner2} onChange={(e) => set("partner2", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-email">Email</Label>
              <Input id="nc-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-phone">Phone</Label>
              <Input id="nc-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Service</Label>
              <Select value={form.serviceLevel} onValueChange={(v) => set("serviceLevel", v as ServiceLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_LEVEL_LABEL) as ServiceLevel[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {SERVICE_LEVEL_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-fee">Planning fee</Label>
              <Input id="nc-fee" inputMode="numeric" placeholder="0" value={form.planningFee} onChange={(e) => set("planningFee", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-source">Source</Label>
              <Input id="nc-source" placeholder="Instagram" value={form.source} onChange={(e) => set("source", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => set("language", v as "en" | "es")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-date">Wedding date</Label>
              <Input id="nc-date" type="date" value={form.weddingDate} onChange={(e) => set("weddingDate", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nc-city">City</Label>
              <Input id="nc-city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!valid || pending}>
              New client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
