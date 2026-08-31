"use client";

import { AppIcon } from "@/features/design-system";
import { Card } from "@/features/design-system";
import { analytics } from "@/services/analytics";

const HELP_ITEMS = [
  {
    icon: "play" as const,
    label: "Watch a 2-minute tutorial",
    href: "#",
  },
  {
    icon: "book" as const,
    label: "Read the Quick Guide",
    href: "#",
  },
  {
    icon: "messageCircle" as const,
    label: "Contact Support",
    href: "#",
  },
];

/**
 * Help card — placed next to the FAQ.
 * Three friendly help options: video tutorial, quick guide, contact support.
 * Uses design-system Card.
 */
export function HelpCard() {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">Need Help?</h3>
      <div className="mt-5 space-y-3">
        {HELP_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={() => analytics.track("help_clicked", { label: item.label })}
            className="flex items-center gap-4 rounded-xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-1)]/50 px-4 py-3.5 transition-colors hover:bg-[color:var(--color-surface-2)] hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-green)]/50"
          >
            <div className="h-10 w-10 rounded-lg bg-[color:var(--color-accent-green)]/10 border border-[color:var(--color-border-accent)] flex items-center justify-center shrink-0">
              <AppIcon name={item.icon} size="md" className="text-[color:var(--color-accent-green)]" strokeWidth={2} />
            </div>
            <span className="text-sm font-medium text-[color:var(--color-text-primary)]">
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
}
