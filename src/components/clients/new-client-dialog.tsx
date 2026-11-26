import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert, useInsertMany, useWorkspace } from "~/data/hooks";
import { writeStarter } from "~/data/starter";
import type { FeeModel, ServiceLevel } from "~/data/types";
import { todayIso } from "~/lib/finance";
import { FEE_MODEL_LABEL, SERVICE_LEVEL_LABEL } from "~/lib/wedding";

import { clientName } from "./client-stats";
import { parseAmount } from "~/components/wedding/wedding-helpers";

/** "New client" — the couple as the planner's customer; a wedding date also creates their wedding. */
export function NewClientButton({ onCreated }: { onCreated?: (id: string) => void }) {
  const ws = useWorkspace();
  const insertClient = useInsert("clients");
  const insertWedding = useInsert("weddings");
  const insertLines = useInsertMany("budgetLines");
  const insertTasks = useInsertMany("tasks");
  const insertTimeline = useInsertMany("timeline");
  const insertPayments = useInsertMany("payments");
  const [open, setOpen] = useState(false);
  const blank = () => ({
    partner1: "",
    partner2: "",
    email: "",
    phone: "",
    serviceLevel: "full" as ServiceLevel,
    feeModel: "flat" as FeeModel,
    feeFlat: "",
    feePercent: "",
    feeHours: "",
    feeRate: "",
    source: "",
    language: "es" as "en" | "es",
    weddingDate: "",
    city: ws.city,
  });
  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valid = form.partner1.trim().length > 0;
  const pending =
    insertClient.isPending ||
    insertWedding.isPending ||
    insertLines.isPending ||
    insertTasks.isPending ||
    insertTimeline.isPending ||
    insertPayments.isPending;

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
      feeModel: form.feeModel,
      feeFlat: form.feeModel === "flat" || form.feeModel === "hybrid" ? parseAmount(form.feeFlat) : null,
      feePercent: form.feeModel === "percent" || form.feeModel === "hybrid" ? parseAmount(form.feePercent) : null,
      feeHours: form.feeModel === "hourly" ? parseAmount(form.feeHours) : null,
      feeRate: form.feeModel === "hourly" ? parseAmount(form.feeRate) : null,
      source: form.source.trim(),
      language: form.language,
      notes: "",
      createdAt: today,
    });
    if (form.weddingDate) {
      const w = await insertWedding.mutateAsync({
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
      await writeStarter(w, ws.plan, c, {
        insertBudgetLines: (rows) => insertLines.mutateAsync(rows),
        insertTasks: (rows) => insertTasks.mutateAsync(rows),
        insertTimeline: (rows) => insertTimeline.mutateAsync(rows),
        insertPayments: (rows) => insertPayments.mutateAsync(rows),
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
              <Label>Fee model</Label>
              <Select value={form.feeModel} onValueChange={(v) => set("feeModel", v as FeeModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FEE_MODEL_LABEL) as FeeModel[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {FEE_MODEL_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.feeModel === "flat" || form.feeModel === "hybrid") && (
              <div className="grid gap-1.5">
                <Label htmlFor="nc-fee">{form.feeModel === "hybrid" ? "Base fee" : "Flat fee"}</Label>
                <Input id="nc-fee" inputMode="decimal" placeholder="—" value={form.feeFlat} onChange={(e) => set("feeFlat", e.target.value)} />
              </div>
            )}
            {(form.feeModel === "percent" || form.feeModel === "hybrid") && (
              <div className="grid gap-1.5">
                <Label htmlFor="nc-pct">Percent</Label>
                <Input id="nc-pct" inputMode="decimal" placeholder="—" value={form.feePercent} onChange={(e) => set("feePercent", e.target.value)} />
              </div>
            )}
            {form.feeModel === "hourly" && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="nc-hours">Hours</Label>
                  <Input id="nc-hours" inputMode="decimal" placeholder="—" value={form.feeHours} onChange={(e) => set("feeHours", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="nc-rate">Hourly rate</Label>
                  <Input id="nc-rate" inputMode="decimal" placeholder="—" value={form.feeRate} onChange={(e) => set("feeRate", e.target.value)} />
                </div>
              </>
            )}
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
