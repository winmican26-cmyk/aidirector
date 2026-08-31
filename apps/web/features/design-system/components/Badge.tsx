"use client";

import { cn } from "../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

const VARIANT_CLASSES = {
  default: "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-strong)]",
  success: "bg-[color:var(--color-status-succeeded)]/10 text-[color:var(--color-status-succeeded)] border-[color:var(--color-status-succeeded)]/30",
  warning: "bg-[color:var(--color-status-warning)]/10 text-[color:var(--color-status-warning)] border-[color:var(--color-status-warning)]/30",
  error: "bg-[color:var(--color-status-failed)]/10 text-[color:var(--color-status-failed)] border-[color:var(--color-status-failed)]/30",
  info: "bg-[color:var(--color-status-running)]/10 text-[color:var(--color-status-running)] border-[color:var(--color-status-running)]/30",
};

/**
 * Small status badge with rounded-full shape.
 * Used for labels, status indicators, and tags.
 */
export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
