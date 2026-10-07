import { Input } from "@libretto-ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";

import { time12 } from "~/lib/format";
import { cellControlClass, cellTriggerClass, cn } from "~/shared/libretto";

import { parseTime } from "../timeline/time";

/**
 * Quiet-grid in-cell controls (DESIGN_LANGUAGE §8) for the Guests / Timeline / Logistics tabs.
 * They read as text at rest and commit on blur. Uncontrolled + keyed on the stored value, so
 * an external change (another cell, a reset) re-renders the cell without a sync effect.
 */

const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") e.currentTarget.blur();
  if (e.key === "Escape") {
    e.currentTarget.value = e.currentTarget.defaultValue;
    e.currentTarget.blur();
  }
};

export function CellText({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      key={value}
      defaultValue={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onKeyDown={blurOnEnter}
      onBlur={(e) => {
        const v = e.currentTarget.value.trim();
        if (v !== value) onCommit(v);
      }}
      className={cn(cellControlClass, "placeholder:text-transparent focus-visible:placeholder:text-muted-foreground", className)}
    />
  );
}

export function CellInt({
  value,
  onCommit,
  ariaLabel,
  className,
  min = 0,
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  ariaLabel: string;
  className?: string;
  min?: number;
}) {
  const shown = value == null ? "" : String(value);
  return (
    <Input
      key={shown}
      defaultValue={shown}
      inputMode="numeric"
      aria-label={ariaLabel}
      onKeyDown={blurOnEnter}
      onChange={(e) => {
        e.currentTarget.value = e.currentTarget.value.replace(/[^\d]/g, "");
      }}
      onBlur={(e) => {
        const raw = e.currentTarget.value.trim();
        const next = raw === "" ? null : Math.max(min, Math.trunc(Number(raw)));
        if (next !== value) onCommit(next);
      }}
      className={cn(cellControlClass, "text-right tabular-nums", className)}
    />
  );
}

/** Time cell: shows "4:30pm", accepts "16:30" / "4:30pm" / "430p". Bad input reverts. */
export function CellTime({
  value,
  onCommit,
  ariaLabel,
  className,
  allowBlank,
}: {
  value: string | null;
  onCommit: (v: string | null) => void;
  ariaLabel: string;
  className?: string;
  allowBlank?: boolean;
}) {
  const shown = value ? time12(value) : "";
  return (
    <Input
      key={value ?? ""}
      defaultValue={shown}
      aria-label={ariaLabel}
      onKeyDown={blurOnEnter}
      onBlur={(e) => {
        const raw = e.currentTarget.value;
        if (!raw.trim()) {
          if (allowBlank && value != null) onCommit(null);
          else e.currentTarget.value = shown;
          return;
        }
        const parsed = parseTime(raw);
        if (!parsed) {
          e.currentTarget.value = shown;
          return;
        }
        if (parsed !== value) onCommit(parsed);
        else e.currentTarget.value = shown;
      }}
      className={cn(cellControlClass, "tabular-nums", className)}
    />
  );
}

export function CellSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v !== value && onChange(v as T)}>
      <SelectTrigger aria-label={ariaLabel} className={cn(cellTriggerClass, "w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
