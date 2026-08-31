"use client";

import * as React from "react";
import { cn } from "../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Loading state — shows spinner and disables */
  loading?: boolean;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-6 text-base rounded-xl",
  lg: "h-12 px-8 text-lg rounded-2xl",
  xl: "h-14 px-10 text-lg rounded-2xl",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-[color:var(--color-accent-green)] to-[color:var(--color-accent-green-dim)] text-[color:var(--color-text-inverse)] font-medium hover:saturate-125 active:translate-y-[1px] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_24px_-8px_rgba(0,230,161,0.6)]",
  secondary:
    "bg-[color:var(--color-surface-2)] border-2 border-[color:var(--color-border-strong)] text-[color:var(--color-text-primary)] font-medium hover:border-[color:var(--color-border-accent)] hover:bg-[color:var(--color-surface-3)] active:bg-[color:var(--color-surface-3)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-secondary)] font-medium hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-1)] active:bg-[color:var(--color-surface-2)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          className,
        )}
        {...rest}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
