import type { ReactNode } from "react";

import { Input } from "@libretto-ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@libretto-ui/select";
import { Textarea } from "@libretto-ui/textarea";

import { cellControlClass, cellTriggerClass, cn } from "~/shared/libretto";

/**
 * Inline-edit property rows for the detail sheets (DESIGN_LANGUAGE §3: one field = inline,
 * blur commits). Ghost controls from the in-cell recipe, so a sheet reads as text at rest.
 * `key={value}` remounts the input when the stored value changes elsewhere.
 */

export function FieldRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function InlineText({
  label,
  value,
  onCommit,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number";
}) {
  return (
    <FieldRow label={label}>
      <Input
        key={value}
        aria-label={label}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        defaultValue={value}
        placeholder={placeholder ?? "—"}
        className={cn(cellControlClass, "-ml-2 placeholder:text-muted-foreground/70")}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim();
          if (v !== value) onCommit(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            e.currentTarget.value = value;
            e.currentTarget.blur();
          }
        }}
      />
    </FieldRow>
  );
}

export function InlineNotes({ label, value, onCommit }: { label: string; value: string; onCommit: (v: string) => void }) {
  return (
    <div className="grid gap-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <Textarea
        key={value}
        aria-label={label}
        defaultValue={value}
        placeholder="—"
        rows={3}
        className={cn(
          "-ml-2 min-h-16 w-[calc(100%+0.5rem)] resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm shadow-none",
          "hover:border-input hover:bg-background focus-visible:border-input focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring",
        )}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim();
          if (v !== value) onCommit(v);
        }}
      />
    </div>
  );
}

export function InlineSelect<T extends string>({
  label,
  value,
  options,
  onCommit,
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string }[];
  onCommit: (v: T) => void;
}) {
  return (
    <FieldRow label={label}>
      <Select value={value || undefined} onValueChange={(v) => v !== value && onCommit(v as T)}>
        <SelectTrigger aria-label={label} className={cn(cellTriggerClass, "-ml-2 w-full justify-between [&>svg]:opacity-40")}>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}
