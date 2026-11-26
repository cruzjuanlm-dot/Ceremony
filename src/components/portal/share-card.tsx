import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@libretto-ui/button";
import { Input } from "@libretto-ui/input";
import { Label } from "@libretto-ui/label";
import { Switch } from "@libretto-ui/switch";

import { Panel } from "~/components/kit";
import { useInsert, useRows, useUpdate } from "~/data/hooks";
import type { Plan, PortalModule, PortalShare } from "~/data/types";
import { PORTAL_MODULES } from "~/data/types";
import { PORTAL_MODULE_LABEL, defaultPortalShare, normalizePortalShare } from "~/lib/portal";

const creating = new Set<string>();

/** Planner controls for the couple's read-only link. One card on every wedding. */
export function PortalShareCard({ weddingId, plan }: { weddingId: string; plan: Plan }) {
  const shares = useRows("portalShares");
  const insert = useInsert("portalShares");
  const update = useUpdate("portalShares");
  const inputRef = useRef<HTMLInputElement>(null);
  const stored = shares.find((s) => s.weddingId === weddingId);
  const share = stored ? normalizePortalShare(stored, plan) : defaultPortalShare(weddingId, plan);
  const pending = insert.isPending || update.isPending;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = `${origin}/portal/${share.token}`;

  function persist(patch: Partial<PortalShare>) {
    const next = { ...share, ...patch };
    if (!stored) {
      if (creating.has(weddingId)) return;
      creating.add(weddingId);
      insert.mutate(next, { onSettled: () => creating.delete(weddingId) });
      return;
    }
    update.mutate({ id: stored.id, patch });
  }

  function setModule(module: PortalModule, on: boolean) {
    const picked = new Set(share.visible);
    if (on) picked.add(module);
    else picked.delete(module);
    persist({ visible: PORTAL_MODULES.filter((m) => picked.has(m)) });
  }

  async function copy() {
    const value = inputRef.current?.value || url;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Link copied");
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      toast.error("Copy the link from the field");
    }
  }

  return (
    <div className="mb-6">
      <Panel
        title="Couple view"
        actions={
          <div className="flex min-h-11 items-center gap-2">
            <Switch
              id={`portal-on-${weddingId}`}
              checked={share.enabled}
              disabled={pending}
              onCheckedChange={(on) => persist({ enabled: on })}
            />
            <Label htmlFor={`portal-on-${weddingId}`} className="font-normal">
              Visible
            </Label>
          </div>
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label htmlFor={`portal-link-${weddingId}`} className="sr-only">
            Couple view link
          </Label>
          <Input
            ref={inputRef}
            id={`portal-link-${weddingId}`}
            readOnly
            value={url}
            spellCheck={false}
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 min-w-0 flex-1"
          />
          <div className="flex gap-2">
            <Button type="button" className="min-h-11 flex-1 sm:flex-none" onClick={() => void copy()}>
              Copy link
            </Button>
            <Button asChild variant="outline" className="min-h-11 flex-1 sm:flex-none">
              <Link to="/portal/$token" params={{ token: share.token }} target="_blank" rel="noreferrer">
                Open
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4">
          {PORTAL_MODULES.map((module) => (
            <div key={module} className="flex min-h-11 items-center gap-2">
              <Switch
                id={`portal-${weddingId}-${module}`}
                checked={share.visible.includes(module)}
                disabled={pending}
                onCheckedChange={(on) => setModule(module, on)}
              />
              <Label htmlFor={`portal-${weddingId}-${module}`} className="font-normal">
                {PORTAL_MODULE_LABEL[module]}
              </Label>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
