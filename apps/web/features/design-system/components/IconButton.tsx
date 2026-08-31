"use client";

import type { ElementType } from "react";
import { cn } from "../utils/cn";

interface IconButtonProps {
  icon: ElementType;
  /** Accessible label (always required for icon-only buttons) */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "primary";
}

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const ICON_SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const VARIANT_CLASSES = {
  default:
    "bg-[color:var(--color-surface-2)] border border-[color:var(--color-border-strong)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-3)] hover:border-[color:var(--color-border-accent)]",
  ghost: "bg-transparent text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-2)]",
  primary:
    "bg-[color:var(--color-accent-green)] text-[color:var(--color-text-inverse)] hover:bg-[color:var(--color-accent-green-dim)] active:bg-[color:var(--color-accent-green-dim)]",
};

/**
 * IconButton — circular icon-only button.
 * Always requires an accessible label.
 */
export function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  className,
  size = "md",
  variant = "default",
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon className={ICON_SIZES[size]} strokeWidth={2} />
    </button>
  );
}
