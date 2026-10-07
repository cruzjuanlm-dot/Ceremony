import { Check } from "lucide-react";

import { Button } from "@libretto-ui/button";

import { Chip, Panel } from "~/components/kit";
import { useWorkspace } from "~/data/hooks";
import { DEMO_PLAN, EXTRA_SEAT_PRICE, PLAN_ORDER, PLANS, type CeremonyPlan } from "~/lib/plans";
import { cn } from "~/shared/libretto";

function PriceLine({ plan }: { plan: CeremonyPlan }) {
  return (
    <div className="mt-2">
      <span className="text-2xl font-semibold tabular-nums">{plan.price}</span>
      <span className="ml-1 text-sm text-muted-foreground">
        {plan.interval === "month" ? "/mo" : plan.interval === "one_time" ? "once" : ""}
      </span>
      <div className="h-4 text-xs text-muted-foreground">
        {plan.annualPrice
          ? `${plan.annualPrice}/mo billed annually`
          : plan.accessMonths
            ? `${plan.accessMonths} months of access`
            : null}
      </div>
    </div>
  );
}

function TierCard({ plan, current }: { plan: CeremonyPlan; current: boolean }) {
  return (
    <div className={cn("flex flex-col rounded-lg border p-4", current && "border-primary ring-1 ring-primary")}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{plan.name}</div>
        {current ? <Chip tone="brand">Current</Chip> : <Chip>{plan.audience === "pro" ? "Planners" : "Couples"}</Chip>}
      </div>
      <PriceLine plan={plan} />
      <ul className="mt-3 flex-1 space-y-1.5 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      {/*
        Disabled until billing is wired. Pro tiers reuse Libretto's Stripe subscription flow
        (lookup keys ceremony_pro_*_monthly). DIY Complete is a ONE-TIME payment, which
        Libretto's subscription-only Checkout does not do — it needs `mode: "payment"` and an
        access-until date instead of a subscription status. That is a billing change.
      */}
      <Button className="mt-4 w-full" variant="outline" disabled>
        {current ? "Current plan" : "Choose plan"}
      </Button>
    </div>
  );
}

export function PlanCard() {
  const ws = useWorkspace();
  const demo = DEMO_PLAN[ws.plan];
  const current = PLANS[demo.key];

  return (
    <Panel
      title="Plan & pricing"
      actions={<span className="text-xs text-muted-foreground">Billing connects at launch</span>}
      bodyClassName="py-4"
    >
      <div className="mb-4 flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-semibold">
          {current.name}
          {demo.status && ` — ${demo.status}`}
        </span>
        <span className="text-sm text-muted-foreground">
          {current.limits.seats === 1 ? "1 seat" : current.limits.seats ? `${current.limits.seats} seats` : "Unlimited seats"}
          {" · "}
          {current.limits.activeWeddings == null
            ? "unlimited weddings"
            : current.limits.activeWeddings === 1
              ? "1 wedding"
              : `${current.limits.activeWeddings} active weddings`}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((k) => (
          <TierCard key={k} plan={PLANS[k]} current={k === demo.key} />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Extra planner seats {EXTRA_SEAT_PRICE}/mo. Client portal and day-of crew seats are free.
      </p>
    </Panel>
  );
}
