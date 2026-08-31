"use client";

import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { AppIcon } from "../components/AppIcon";

interface SuccessToastProps {
  message: string;
  /** Auto-dismiss duration in ms (default: 4000). Set to 0 to disable auto-dismiss. */
  duration?: number;
  /** Controlled visibility */
  visible: boolean;
  /** Called when toast should be dismissed */
  onDismiss?: () => void;
  className?: string;
}

/**
 * SuccessToast — A green success toast that auto-dismisses.
 *
 * Usage:
 *   const [show, setShow] = useState(false);
 *   <SuccessToast
 *     message="Clips created successfully!"
 *     visible={show}
 *     onDismiss={() => setShow(false)}
 *   />
 *
 * Accessible: uses `role="status"` and `aria-live="polite"`.
 */
export function SuccessToast({
  message,
  duration = 4000,
  visible,
  onDismiss,
  className,
}: SuccessToastProps) {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => setAnimating(true));

      if (duration > 0 && onDismiss) {
        const timer = setTimeout(() => {
          setAnimating(false);
          setTimeout(() => {
            setMounted(false);
            onDismiss();
          }, 200);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[color:var(--color-status-succeeded)]/30 bg-[color:var(--color-status-succeeded)]/10 px-5 py-4 shadow-[var(--shadow-elevated)] transition-all duration-200",
        animating
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0",
        className,
      )}
    >
      <AppIcon
        name="checkCircle"
        size="md"
        className="text-[color:var(--color-status-succeeded)] shrink-0"
      />
      <p className="text-sm font-medium text-[color:var(--color-text-primary)]">{message}</p>
      {onDismiss && (
        <button
          onClick={() => {
            setAnimating(false);
            setTimeout(() => {
              setMounted(false);
              onDismiss();
            }, 200);
          }}
          className="ml-2 shrink-0 rounded-lg p-1 text-[color:var(--color-status-succeeded)] hover:bg-[color:var(--color-status-succeeded)]/15 transition-colors"
          aria-label="Dismiss"
        >
          <AppIcon name="x" size="sm" />
        </button>
      )}
    </div>
  );
}
