import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@libretto-ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@libretto-ui/dialog";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Textarea } from "@libretto-ui/textarea";

import { useInsert, useRows, useWorkspace } from "~/data/hooks";

import { DemoSendChip } from "./thread-view";

/** "New email" — logs an outbound message as a new thread. Demo: nothing is actually sent. */
export function NewEmailButton({ onCreated }: { onCreated?: (threadId: string) => void }) {
  const ws = useWorkspace();
  const weddings = useRows("weddings");
  const vendors = useRows("vendors");
  const clients = useRows("clients");
  const insert = useInsert("emails");
  const [open, setOpen] = useState(false);
  const blank = { to: "", weddingId: "", subject: "", body: "" };
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const valid = form.to.trim() && form.subject.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const to = form.to.trim();
    const lower = to.toLowerCase();
    const vendor = vendors.find((v) => v.email.toLowerCase() === lower);
    const client = clients.find((c) => c.email.toLowerCase() === lower);
    const threadId = `thr_${Date.now().toString(36)}`;
    await insert.mutateAsync({
      threadId,
      weddingId: form.weddingId || (ws.plan === "diy" ? (weddings[0]?.id ?? null) : null),
      vendorId: vendor?.id ?? null,
      clientId: client?.id ?? null,
      direction: "out",
      fromName: ws.ownerName,
      fromEmail: ws.ownerEmail,
      to,
      subject: form.subject.trim(),
      body: form.body,
      sentAt: new Date().toISOString(),
      read: true,
    });
    setForm(blank);
    setOpen(false);
    onCreated?.(threadId);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New email</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ne-to">To</Label>
            <Input
              id="ne-to"
              type="email"
              list="ne-contacts"
              placeholder="name@example.com"
              value={form.to}
              onChange={(e) => set("to")(e.target.value)}
              autoFocus
            />
            <datalist id="ne-contacts">
              {vendors.map((v) => (
                <option key={v.id} value={v.email}>
                  {v.name}
                </option>
              ))}
              {clients.map((c) => (
                <option key={c.id} value={c.email}>
                  {c.partner1} & {c.partner2}
                </option>
              ))}
            </datalist>
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
            <Label htmlFor="ne-subject">Subject</Label>
            <Input id="ne-subject" value={form.subject} onChange={(e) => set("subject")(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ne-body">Message</Label>
            <Textarea id="ne-body" rows={7} value={form.body} onChange={(e) => set("body")(e.target.value)} />
          </div>
          <DialogFooter className="items-center gap-2 sm:justify-between">
            <DemoSendChip />
            <Button type="submit" disabled={!valid || insert.isPending}>
              Save to log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
