"use client";

import { cn } from "../utils/cn";

type StatusBadgeVariant = "ready" | "processing" | "failed" | "draft";

interface StatusBadgeProps {
  status: StatusBadgeVariant;
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusBadgeVariant,
  { label: string; container: string; dot: string }
> = {
  ready: {
    label: "Ready",
    container: "bg-[color:var(--color-status-succeeded)]/10 text-[color:var(--color-status-succeeded)] border-[color:var(--color-status-succeeded)]/30",
    dot: "bg-[color:var(--color-status-succeeded)]",
  },
  processing: {
    label: "Processing",
    container: "bg-[color:var(--color-status-running)]/10 text-[color:var(--color-status-running)] border-[color:var(--color-status-running)]/30",
    dot: "bg-[color:var(--color-status-running)]",
  },
  failed: {
    label: "Failed",
    container: "bg-[color:var(--color-status-failed)]/10 text-[color:var(--color-status-failed)] border-[color:var(--color-status-failed)]/30",
    dot: "bg-[color:var(--color-status-failed)]",
  },
  draft: {
    label: "Draft",
    container: "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-strong)]",
    dot: "bg-[color:var(--color-text-tertiary)]",
  },
};

/**
 * StatusBadge — small pill badge showing a processing/status state.
 *
 * Usage:
 *   <StatusBadge status="ready" />
 *   <StatusBadge status="processing" />
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.container,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
