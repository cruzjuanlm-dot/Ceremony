import type { Client, FeeModel } from "~/data/types";
import { money } from "~/lib/format";
import { FEE_MODEL_LABEL } from "~/lib/wedding";

import { parseAmount } from "~/components/wedding/wedding-helpers";
import { InlineSelect, InlineText } from "~/components/vendors/inline-field";

const MODEL_OPTIONS = (Object.keys(FEE_MODEL_LABEL) as FeeModel[]).map((k) => ({
  value: k,
  label: FEE_MODEL_LABEL[k],
}));

function amountText(n: number | null): string {
  return n == null ? "" : String(n);
}

/**
 * The four ways a planner bills (research §1.16). The quote itself is computed;
 * this only edits the inputs. Blank stays blank.
 */
export function FeeTermsEditor({
  client,
  quote,
  onCommit,
}: {
  client: Client;
  /** Computed fee for the wedding in view. Omit on a client with several weddings. */
  quote?: number | null;
  onCommit: (patch: Partial<Client>) => void;
}) {
  const model = client.feeModel;
  const showFlat = model === "flat" || model === "hybrid";
  const showPercent = model === "percent" || model === "hybrid";
  const showHourly = model === "hourly";

  return (
    <div className="grid min-w-0 gap-1">
      <InlineSelect
        label="Fee model"
        value={model}
        options={MODEL_OPTIONS}
        onCommit={(v) => onCommit({ feeModel: v })}
      />
      {showFlat && (
        <InlineText
          label={model === "hybrid" ? "Base fee" : "Flat fee"}
          type="number"
          value={amountText(client.feeFlat)}
          onCommit={(v) => onCommit({ feeFlat: parseAmount(v) })}
        />
      )}
      {showPercent && (
        <InlineText
          label="Percent"
          inputMode="decimal"
          value={amountText(client.feePercent)}
          onCommit={(v) => onCommit({ feePercent: parseAmount(v.replace("%", "")) })}
        />
      )}
      {showHourly && (
        <>
          <InlineText
            label="Hours"
            inputMode="decimal"
            value={amountText(client.feeHours)}
            onCommit={(v) => onCommit({ feeHours: parseAmount(v) })}
          />
          <InlineText
            label="Hourly rate"
            type="number"
            value={amountText(client.feeRate)}
            onCommit={(v) => onCommit({ feeRate: parseAmount(v) })}
          />
        </>
      )}
      {quote !== undefined && (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2">
          <div className="text-sm text-muted-foreground">Fee</div>
          <div className="px-0.5 text-sm font-medium tabular-nums">{money(quote)}</div>
        </div>
      )}
    </div>
  );
}
