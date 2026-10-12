import type { ReactNode } from "react";

import {
  segmentedItem,
  segmentedShell,
  type SegmentedSize,
} from "@/components/ui/segmented-control-classes";

/**
 * The one segmented control.
 *
 * Five hand-rolled copies of this existed before (2026-07-26), disagreeing on radius,
 * background and type size — so the same gesture looked different on nearly every screen.
 * A control that changes appearance between screens has to be re-learned on each one, which
 * is most of what made the app feel convoluted. Anything that switches between a few mutually
 * exclusive views uses this; nothing rolls its own again.
 *
 * Navigation that *looks* like a segmented control (the Resources tabs) can't use the button
 * version, because router links need their own typed `to` prop — those import
 * `segmentedShell` / `segmentedItem` instead, so the styling still has exactly one source.
 */

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Optional leading glyph. Keep it decorative — the label carries the meaning. */
  icon?: ReactNode;
};

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "sm",
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: readonly SegmentedOption<T>[];
  size?: SegmentedSize;
  className?: string;
  "aria-label": string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={[segmentedShell(size), className].filter(Boolean).join(" ")}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            // aria-pressed (not aria-selected): these are toggle buttons in a group, not
            // tabs controlling panels. Screen readers announce the state either way, but
            // only this one is correct outside a tablist.
            aria-pressed={selected}
            onClick={() => onValueChange(o.value)}
            className={segmentedItem(selected)}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
