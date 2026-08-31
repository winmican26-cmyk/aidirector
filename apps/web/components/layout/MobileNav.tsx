"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/brand/LogoMark";
import { cn } from "@/lib/cn";
import { AppIcon } from "@/features/design-system";
import { NAV, NAV_BOTTOM } from "./Sidebar";

/**
 * MobileNav — slide-in drawer navigation for screens below `lg`.
 *
 * The desktop sidebar is `hidden lg:flex`, so on small screens this
 * drawer (triggered by a hamburger in the TopBar) is the only way to
 * navigate between app sections. Reuses the same nav item list as the
 * Sidebar so the two never drift apart.
 *
 * Closes on: link click, backdrop click, and Escape. Locks body scroll
 * while open.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  // Close the drawer when the route changes (link click navigates).
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  const renderLink = (
    item: { href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; accent?: boolean },
    isBottom = false,
  ) => {
    const active = pathname?.startsWith(item.href) ?? false;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href as never}
        onClick={close}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium tracking-tight transition-colors",
          active
            ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-primary)] shadow-[inset_3px_0_0_var(--color-accent-blue)]"
            : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]/60 hover:text-[color:var(--color-text-primary)]",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active
              ? "text-[color:var(--color-accent-blue)]"
              : "text-[color:var(--color-text-tertiary)] group-hover:text-[color:var(--color-text-secondary)]",
          )}
          strokeWidth={2}
        />
        <span>{item.label}</span>
        {item.accent && !active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-blue)]" />
        )}
        {isBottom && active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-blue)]" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger trigger — visible only below lg */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-accent)] hover:text-[color:var(--color-text-primary)] transition-colors"
      >
        <AppIcon name="menu" size="md" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              id="mobile-nav"
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-0)] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="App navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="flex items-center justify-between gap-2.5 px-6 h-16 border-b border-[color:var(--color-border-soft)]">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="h-7 w-7" />
                  <div className="flex flex-col">
                    <span className="font-semibold tracking-tight text-sm">AI Director</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
                      Sports · v0.9
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close navigation"
                  className="rounded-lg p-1.5 text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                >
                  <AppIcon name="x" size="sm" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {NAV.map((item) => renderLink(item))}
              </nav>

              <nav className="px-3 py-2 border-t border-[color:var(--color-border-soft)]">
                {NAV_BOTTOM.map((item) => renderLink(item, true))}
              </nav>

              <div className="px-5 py-4 border-t border-[color:var(--color-border-soft)] text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
                OmegaClips · 78fcd57
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
