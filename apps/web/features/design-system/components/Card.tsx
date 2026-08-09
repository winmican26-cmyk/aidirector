"use client";

import type { ReactNode } from "react";
import { cn } from "../utils/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Enable hover effect */
  hoverable?: boolean;
  /** Smaller padding variant */
  dense?: boolean;
  onClick?: () => void;
}

/**
 * Card — white rounded-2xl container with border and shadow.
 * The primary surface for grouping content on creator screens.
 *
 * Radius: 16px (rounded-2xl) per spec. White bg, slate-200 border.
 */
export function Card({
  children,
  className,
  hoverable = false,
  dense = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "rounded-2xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border-strong)] shadow-[var(--shadow-card)]",
        dense ? "p-4" : "p-6 md:p-8",
        hoverable &&
          "transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-[color:var(--color-border-accent)]",
        onClick && "text-left w-full cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
