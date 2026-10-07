import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Input } from "@libretto-ui/input";

import { money } from "~/lib/format";
import { cellControlClass, cn } from "~/shared/libretto";

import { parseAmount } from "./wedding-helpers";

/**
 * The wedding page's inline-edit controls (DESIGN_LANGUAGE §3 + §8). Every one reads as
 * TEXT at rest, shows its affordance on hover/focus, and commits on blur or Enter (Escape
 * cancels). Local replicas of Libretto's CellNumber / CellSelect behaviour — those live
 * outside the doorway.
 */

/** Money cell: "$1,200" at rest, the raw number while focused. Blank stays blank. */
export function CellAmount({
  value,
  onCommit,
  ariaLabel,
  className,
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={draft ?? (value == null ? "" : money(value))}
      onFocus={(e) => {
        setDraft(value == null ? "" : String(value));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const d = draft;
        setDraft(null);
        if (cancelled.current) {
          cancelled.current = false;
          return;
        }
        if (d == null) return;
        const next = parseAmount(d);
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(cellControlClass, "text-right tabular-nums", className)}
    />
  );
}

/**
 * Text cell. `placeholder` shows only when blank. Date/time cells pass `display`: native
 * date/time inputs draw their own chrome (mm/dd/yyyy, a calendar glyph), so at rest those
 * render as a plain-text button and swap to the input on click.
 */
export function CellText(props: Parameters<typeof CellTextInput>[0] & { display?: ReactNode }) {
  const { display, ...rest } = props;
  const [editing, setEditing] = useState(false);
  if (display === undefined || editing) {
    return <CellTextInput {...rest} autoFocus={editing} onDone={() => setEditing(false)} />;
  }
  return (
    <button
      type="button"
      aria-label={rest.ariaLabel}
      onClick={() => setEditing(true)}
      className={cn(cellControlClass, "block truncate text-left", rest.className)}
    >
      {display}
    </button>
  );
}

function CellTextInput({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  className,
  type = "text",
  allowEmpty = true,
  autoFocus,
  onDone,
}: {
  value: string;
  onCommit: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  type?: "text" | "time" | "date";
  allowEmpty?: boolean;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  return (
    <input
      type={type}
      aria-label={ariaLabel}
      placeholder={placeholder}
      autoFocus={autoFocus}
      value={draft ?? value}
      onFocus={() => setDraft(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const d = draft;
        setDraft(null);
        onDone?.();
        if (cancelled.current) {
          cancelled.current = false;
          return;
        }
        if (d == null) return;
        const next = type === "text" ? d.trim() : d;
        if (!next && !allowEmpty) return;
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(cellControlClass, "placeholder:text-muted-foreground/70", className)}
    />
  );
}

/** Native select in cell-control clothing: plain text at rest, chevron on hover/focus. */
export function GhostSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span className={cn("relative block", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(cellControlClass, "peer cursor-pointer appearance-none truncate pr-7")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-0 transition-opacity",
          "[tr:hover_&]:opacity-40 [li:hover_&]:opacity-40 peer-hover:opacity-60 peer-focus:opacity-60",
          "[@media(pointer:coarse)]:opacity-50",
        )}
      />
    </span>
  );
}

/**
 * A labelled key fact (header strip): the value is a button at rest; clicking swaps in an
 * input of the right type. Libretto's DateField / ShowTimeField / EventTextField pattern.
 */
export function InlineFact({
  label,
  display,
  value,
  type = "text",
  onCommit,
  allowEmpty = true,
  className,
}: {
  label: string;
  display: ReactNode;
  /** The raw string the input edits ("" when blank). */
  value: string;
  type?: "text" | "date" | "time" | "number";
  onCommit: (v: string) => void;
  allowEmpty?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelled = useRef(false);
  const id = `fact-${label.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="block px-1 text-xs text-muted-foreground">
        {label}
      </label>
      {editing ? (
        <Input
          id={id}
          autoFocus
          type={type === "number" ? "text" : type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={draft}
          onFocus={(e) => type !== "date" && type !== "time" && e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (cancelled.current) {
              cancelled.current = false;
              return;
            }
            const next = draft.trim();
            if (!next && !allowEmpty) return;
            if (next !== value) onCommit(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              cancelled.current = true;
              e.currentTarget.blur();
            }
          }}
          className="mt-0.5 h-7 w-40 max-w-full px-1 text-sm font-medium"
        />
      ) : (
        <button
          id={id}
          type="button"
          title={`Edit ${label.toLowerCase()}`}
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="mt-0.5 block max-w-full truncate rounded px-1 lg:overflow-visible py-0.5 text-left text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {display}
        </button>
      )}
    </div>
  );
}

/** Long-form note that reads as a paragraph at rest and commits on blur. */
export function InlineTextarea({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  rows = 3,
}: {
  value: string;
  onCommit: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  rows?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <textarea
      aria-label={ariaLabel}
      placeholder={placeholder}
      rows={rows}
      value={draft ?? value}
      onFocus={() => setDraft(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const d = draft;
        setDraft(null);
        if (d != null && d.trim() !== value.trim()) onCommit(d.trim());
      }}
      className={cn(
        "-mx-2 block w-[calc(100%+1rem)] resize-y rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-relaxed transition-colors",
        "placeholder:text-muted-foreground/70 hover:border-input focus-visible:border-input focus-visible:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      )}
    />
  );
}
