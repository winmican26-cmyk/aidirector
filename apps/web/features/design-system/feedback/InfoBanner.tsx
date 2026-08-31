"use client";

import { useState } from "react";
import { cn } from "../utils/cn";
import { AppIcon } from "../components/AppIcon";
import type { AppIconName } from "../components/AppIcon";

type InfoBannerTone = "info" | "success" | "warning" | "error";

interface InfoBannerProps {
  tone?: InfoBannerTone;
  title?: string;
  message: string;
  /** Show a dismiss button */
  dismissable?: boolean;
  className?: string;
  /** Called after dismissal animation completes */
  onDismiss?: () => void;
}

const TONE_CONFIG: Record<
  InfoBannerTone,
  { icon: AppIconName; container: string; text: string; iconColor: string }
> = {
  info: {
    icon: "info",
    container: "bg-[color:var(--color-status-running)]/10 border-[color:var(--color-status-running)]/30",
    text: "text-[color:var(--color-status-running)]",
    iconColor: "text-[color:var(--color-status-running)]",
  },
  success: {
    icon: "checkCircle",
    container: "bg-[color:var(--color-status-succeeded)]/10 border-[color:var(--color-status-succeeded)]/30",
    text: "text-[color:var(--color-status-succeeded)]",
    iconColor: "text-[color:var(--color-status-succeeded)]",
  },
  warning: {
    icon: "alertCircle",
    container: "bg-[color:var(--color-status-warning)]/10 border-[color:var(--color-status-warning)]/30",
    text: "text-[color:var(--color-status-warning)]",
    iconColor: "text-[color:var(--color-status-warning)]",
  },
  error: {
    icon: "alertCircle",
    container: "bg-[color:var(--color-status-failed)]/10 border-[color:var(--color-status-failed)]/30",
    text: "text-[color:var(--color-status-failed)]",
    iconColor: "text-[color:var(--color-status-failed)]",
  },
};

/**
 * InfoBanner — A contextual banner for info, success, warning, or error messages.
 *
 * Usage:
 *   <InfoBanner tone="info" message="Processing may take a few minutes." />
 *   <InfoBanner tone="warning" title="Heads up" message="Long videos take longer." dismissable />
 *
 * Accessible: uses `role="status"` and `aria-live="polite"`.
 */
export function InfoBanner({
  tone = "info",
  title,
  message,
  dismissable = false,
  className,
  onDismiss,
}: InfoBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = TONE_CONFIG[tone];

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 transition-all duration-200",
        config.container,
        className,
      )}
    >
      <AppIcon
        name={config.icon}
        size="md"
        className={cn("shrink-0 mt-0.5", config.iconColor)}
      />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold mb-0.5 text-inherit">
            {title}
          </p>
        )}
        <p className={cn("text-sm", config.text)}>{message}</p>
      </div>
      {dismissable && onDismiss && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className={cn(
            "shrink-0 rounded-lg p-1 transition-colors",
            config.text,
            "hover:bg-white/10",
          )}
          aria-label="Dismiss"
        >
          <AppIcon name="x" size="sm" />
        </button>
      )}
    </div>
  );
}
