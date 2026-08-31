"use client";

import { AppIcon } from "@/features/design-system";
import { cn } from "@/features/design-system/utils/cn";

interface ClipCountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * Stepper for selecting clip count.
 * Range 6–24, default 12.
 * Ask: "How many clips would you like?"
 */
export function ClipCountSelector({
  value,
  onChange,
  min = 6,
  max = 24,
}: ClipCountSelectorProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)]">
        How many clips would you like?
      </h2>
      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          aria-label="Decrease clip count"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all duration-200",
            value <= min
              ? "border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)] cursor-not-allowed"
              : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-accent)] hover:text-[color:var(--color-accent-green)] hover:shadow-[var(--shadow-card-hover)]",
          )}
        >
          <AppIcon name="minus" size="md" strokeWidth={2} />
        </button>

        <div className="flex flex-col items-center">
          <span
            className="text-4xl font-bold text-[color:var(--color-text-primary)] tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {value}
          </span>
          <span className="text-sm text-[color:var(--color-text-tertiary)] mt-0.5">clips</span>
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          aria-label="Increase clip count"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all duration-200",
            value >= max
              ? "border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)] cursor-not-allowed"
              : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-accent)] hover:text-[color:var(--color-accent-green)] hover:shadow-[var(--shadow-card-hover)]",
          )}
        >
          <AppIcon name="plus" size="md" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}
