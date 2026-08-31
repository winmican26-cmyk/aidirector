"use client";

import { cn } from "../utils/cn";
import { AppIcon } from "../components/AppIcon";

export interface TimelineStage {
  id: string;
  label: string;
  /** Progress threshold (0–100) at which this stage becomes active */
  threshold: number;
}

interface ProgressTimelineProps {
  stages: TimelineStage[];
  currentProgress: number;
  className?: string;
}

/**
 * ProgressTimeline — A vertical "What's Happening?" timeline.
 *
 * Shows where the user is in the processing flow:
 *   ✓ Completed stages (green check)
 *   ● Active stage     (emerald pulsing dot)
 *   ○ Pending stages   (muted circle)
 *
 * Usage:
 *   <ProgressTimeline
 *     stages={PROCESSING_STAGES}
 *     currentProgress={progress}
 *   />
 *
 * Accessible: uses `aria-label="Processing progress"` on the list.
 */
export function ProgressTimeline({
  stages,
  currentProgress,
  className,
}: ProgressTimelineProps) {
  // Find the index of the active stage — the last stage whose threshold is <= progress
  let activeIndex = 0;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (currentProgress >= stages[i].threshold) {
      activeIndex = i;
      break;
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-tertiary)] mb-3 text-center">
        What&apos;s Happening?
      </h4>
      <ul
        className="space-y-0"
        aria-label="Processing progress"
      >
        {stages.map((stage, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <li
              key={stage.id}
              className={cn(
                "flex items-center gap-3 py-2.5 transition-colors duration-300",
                isCompleted && "text-[color:var(--color-accent-green)]",
                isActive && "text-[color:var(--color-text-primary)]",
                isPending && "text-[color:var(--color-text-tertiary)]",
              )}
            >
              {/* Status indicator */}
              <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
                {isCompleted && (
                  <AppIcon
                    name="checkCircle"
                    size="sm"
                    className="text-[color:var(--color-accent-green)]"
                  />
                )}
                {isActive && (
                  <span className="relative flex h-3 w-3">
                    {/* Pinging ring */}
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full rounded-full bg-[color:var(--color-accent-green)] opacity-75",
                        "motion-safe:animate-ping",
                      )}
                    />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[color:var(--color-accent-green)]" />
                  </span>
                )}
                {isPending && (
                  <span className="h-3 w-3 rounded-full border-2 border-[color:var(--color-border-strong)]" />
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-sm transition-all duration-300",
                  isActive && "font-semibold",
                  isCompleted && "line-through decoration-[color:var(--color-accent-green)]/30",
                )}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
