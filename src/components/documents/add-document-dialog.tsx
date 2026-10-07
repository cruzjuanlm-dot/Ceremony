import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { useInsert, useRows, useWorkspace } from "~/data/hooks";
import type { DocumentKind, DocumentStatus } from "~/data/types";
import { DOC_KIND_LABEL, DOC_STATUS_LABEL } from "~/lib/wedding";

import { DOC_KINDS, DOC_STATUSES, parseParty } from "./doc-meta";

/** "Add document" — records a LINK to a contract/proposal/etc. (Add: it attaches to a wedding.) */
export function AddDocumentButton() {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const vendors = useRows("vendors");
  const clients = useRows("clients");
  const insert = useInsert("documents");
  const [open, setOpen] = useState(false);
  const blank = {
    title: "",
    kind: "contract" as DocumentKind,
    weddingId: ws.plan === "diy" ? (weddings[0]?.id ?? "") : "",
    party: "",
    status: "draft" as DocumentStatus,
    amount: "",
    url: "",
  };
  const [form, setForm] = useState(blank);
  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const amount = form.amount.trim() === "" ? null : Number(form.amount.replace(/[$,]/g, ""));
    await insert.mutateAsync({
      title: form.title.trim(),
      kind: form.kind,
      weddingId: form.weddingId || null,
      ...parseParty(form.party),
      status: form.status,
      amount: amount != null && Number.isFinite(amount) ? amount : null,
      url: form.url.trim(),
      notes: "",
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setForm(blank);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ad-title">Title</Label>
            <Input id="ad-title" placeholder="Photographer — service agreement" value={form.title} onChange={(e) => set("title")(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(v) => set("kind")(v as DocumentKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {DOC_KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status")(v as DocumentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DOC_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {ws.plan === "pro" && (
            <div className="grid gap-1.5">
              <Label>Wedding</Label>
              <Select value={form.weddingId || "none"} onValueChange={(v) => set("weddingId")(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No wedding</SelectItem>
                  {weddings.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>{ws.plan === "pro" ? "Vendor or client" : "Vendor"}</Label>
            <Select value={form.party || "none"} onValueChange={(v) => set("party")(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={`c:${c.id}`}>
                    {c.partner1} & {c.partner2} (client)
                  </SelectItem>
                ))}
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={`v:${v.id}`}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ad-amount">Amount</Label>
              <Input id="ad-amount" inputMode="decimal" placeholder="—" value={form.amount} onChange={(e) => set("amount")(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ad-url">Link</Label>
              <Input id="ad-url" type="url" placeholder="https://" value={form.url} onChange={(e) => set("url")(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!form.title.trim() || insert.isPending}>
              Add document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
