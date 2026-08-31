import Link from "next/link";

/**
 * Minimal footer — privacy, terms, support links, and version.
 */
export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border-strong)] pt-8 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[color:var(--color-text-tertiary)]">
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="hover:text-[color:var(--color-text-primary)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[color:var(--color-text-primary)] transition-colors"
          >
            Terms
          </Link>
          <span className="hover:text-[color:var(--color-text-primary)] transition-colors cursor-pointer">
            Support
          </span>
        </div>
        <span className="text-xs text-[color:var(--color-text-muted)]">v0.9</span>
      </div>
    </footer>
  );
}
