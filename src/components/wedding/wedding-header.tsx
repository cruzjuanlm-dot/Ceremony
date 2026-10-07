import { Link } from "@tanstack/react-router";

import { Chip, CoupleName } from "~/components/kit";
import { PhaseChip } from "~/components/status";
import { useRows, useUpdate, useWorkspace } from "~/data/hooks";
import type { CeremonyType, Wedding } from "~/data/types";
import { dateLong, money, time12 } from "~/lib/format";
import { CEREMONY_LABEL, countdownLabel, daysUntil, weddingPhase } from "~/lib/wedding";
import { BackButton } from "~/shared/libretto";

import { GhostSelect, InlineFact } from "./fields";
import { parseAmount } from "./wedding-helpers";

const CEREMONY_OPTIONS = (Object.keys(CEREMONY_LABEL) as CeremonyType[]).map((k) => ({
  value: k,
  label: CEREMONY_LABEL[k],
}));

/** The wedding page's title block: couple, derived phase, countdown, and the editable key facts. */
export function WeddingHeader({ wedding: w }: { wedding: Wedding }) {
  const ws = useWorkspace();
  const clients = useRows("clients");
  const update = useUpdate("weddings");
  const client = w.clientId ? clients.find((c) => c.id === w.clientId) : undefined;
  const days = daysUntil(w);
  const save = (patch: Partial<Wedding>) => update.mutate({ id: w.id, patch });

  return (
    <header className="mb-6">
      {ws.plan === "pro" && (
        <div className="mb-2 flex items-center gap-2">
          <BackButton fallbackTo="/weddings" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0">
          <CoupleName className="text-3xl leading-tight sm:text-4xl">{w.title}</CoupleName>
        </h1>
        <PhaseChip phase={weddingPhase(w)} />
        <span className="text-sm text-muted-foreground">
          {days != null && days > 1 ? `${countdownLabel(days)} to go` : countdownLabel(days)}
        </span>
        {client && (
          <Link to="/clients" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Chip tone="brand" className="hover:opacity-80">
              Client · {client.partner1} & {client.partner2}
            </Chip>
          </Link>
        )}
      </div>

      <div className="-ml-1 mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-x-8 lg:[&>*]:shrink-0">
        <InlineFact
          label="Date"
          type="date"
          value={w.date ?? ""}
          display={dateLong(w.date)}
          onCommit={(v) => save({ date: v || null })}
        />
        <InlineFact
          label="Ceremony time"
          type="time"
          value={w.ceremonyTime ?? ""}
          display={time12(w.ceremonyTime)}
          onCommit={(v) => save({ ceremonyTime: v || null })}
        />
        <InlineFact
          label="City"
          value={w.city}
          display={w.city || "—"}
          onCommit={(v) => save({ city: v })}
        />
        <InlineFact
          label="Guests"
          type="number"
          value={String(w.guestEstimate)}
          display={`~${w.guestEstimate}`}
          allowEmpty={false}
          onCommit={(v) => {
            const n = parseAmount(v);
            if (n != null && n >= 0) save({ guestEstimate: Math.round(n) });
          }}
        />
        <InlineFact
          label="Budget target"
          type="number"
          value={String(w.budgetTarget)}
          display={money(w.budgetTarget)}
          allowEmpty={false}
          onCommit={(v) => {
            const n = parseAmount(v);
            if (n != null && n >= 0) save({ budgetTarget: n });
          }}
        />
        <div className="min-w-0">
          <div className="px-1 text-xs text-muted-foreground">Ceremony type</div>
          <GhostSelect
            ariaLabel="Ceremony type"
            value={w.ceremonyType}
            options={CEREMONY_OPTIONS}
            onChange={(v) => save({ ceremonyType: v })}
            className="-ml-1 mt-0.5 w-40 [&_select]:h-7 [&_select]:font-medium"
          />
        </div>
      </div>
    </header>
  );
}
