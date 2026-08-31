"use client";

import { cn } from "../utils/cn";

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

/**
 * Platform badge mapping — human-readable labels for internal platform IDs.
 * Extend this as new platforms are added.
 */
const PLATFORM_LABELS: Record<string, string> = {
  youtube_shorts: "YouTube Shorts",
  tiktok: "TikTok",
  instagram_reels: "Instagram Reels",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  snapchat: "Snapchat",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube_shorts: "bg-[color:var(--color-status-failed)]/10 text-[color:var(--color-status-failed)] border-[color:var(--color-status-failed)]/30",
  tiktok: "bg-[color:var(--color-status-running)]/10 text-[color:var(--color-status-running)] border-[color:var(--color-status-running)]/30",
  instagram_reels: "bg-[color:var(--color-accent-magenta)]/10 text-[color:var(--color-accent-magenta)] border-[color:var(--color-accent-magenta)]/30",
  twitter: "bg-[color:var(--color-status-running)]/10 text-[color:var(--color-status-running)] border-[color:var(--color-status-running)]/30",
  linkedin: "bg-[color:var(--color-status-running)]/10 text-[color:var(--color-status-running)] border-[color:var(--color-status-running)]/30",
  facebook: "bg-[color:var(--color-status-running)]/10 text-[color:var(--color-status-running)] border-[color:var(--color-status-running)]/30",
  snapchat: "bg-[color:var(--color-status-warning)]/10 text-[color:var(--color-status-warning)] border-[color:var(--color-status-warning)]/30",
};

/**
 * PlatformBadge — small pill badge for social platform labels.
 *
 * Usage:
 *   <PlatformBadge platform="youtube_shorts" />
 *   <PlatformBadge platform="tiktok" />
 *
 * Falls back to a neutral style for unknown platforms.
 */
export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const label = PLATFORM_LABELS[platform] ?? platform;
  const color = PLATFORM_COLORS[platform] ?? "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-strong)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight",
        color,
        className,
      )}
    >
      {label}
    </span>
  );
}
