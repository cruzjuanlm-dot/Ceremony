import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Switch } from "@libretto-ui/switch";

import { useInsert, useWorkspace } from "~/data/hooks";
import type { VendorCategory } from "~/data/types";
import { VENDOR_CATEGORY_LABEL } from "~/lib/wedding";

/** "New vendor" — a standalone directory entry (DESIGN_LANGUAGE §1). */
export function NewVendorButton({ onCreated }: { onCreated?: (id: string) => void }) {
  const ws = useWorkspace();
  const insert = useInsert("vendors");
  const [open, setOpen] = useState(false);
  const blank = () => ({
    name: "",
    category: "photography" as VendorCategory,
    contactName: "",
    email: "",
    phone: "",
    city: ws.city,
    preferred: false,
  });
  const [form, setForm] = useState(blank);
  const set = <K extends keyof ReturnType<typeof blank>>(k: K, v: ReturnType<typeof blank>[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const v = await insert.mutateAsync({
      ...form,
      name: form.name.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      instagram: "",
      notes: "",
    });
    setOpen(false);
    onCreated?.(v.id);
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
          New vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nv-name">Business name</Label>
            <Input id="nv-name" value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as VendorCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VENDOR_CATEGORY_LABEL) as VendorCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {VENDOR_CATEGORY_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nv-contact">Contact</Label>
              <Input id="nv-contact" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nv-email">Email</Label>
              <Input id="nv-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nv-phone">Phone</Label>
              <Input id="nv-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nv-city">City</Label>
            <Input id="nv-city" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          {ws.plan === "pro" && (
            <div className="flex items-center gap-2">
              <Switch id="nv-pref" checked={form.preferred} onCheckedChange={(c) => set("preferred", c)} />
              <Label htmlFor="nv-pref">Preferred vendor</Label>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!form.name.trim() || insert.isPending}>
              New vendor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
