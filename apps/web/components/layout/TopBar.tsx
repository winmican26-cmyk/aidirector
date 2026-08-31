"use client";

import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/design-system/Badge";
import { MobileNav } from "./MobileNav";

interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Right-side content (action buttons, badges, etc.) */
  trailing?: React.ReactNode;
}

export function TopBar({ title, subtitle, trailing }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 px-6 lg:px-8 h-16 border-b border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-0)]/85 backdrop-blur-xl">
      <MobileNav />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
          <Badge tone="muted">workspace</Badge>
        </div>
        {subtitle && (
          <p className="text-xs text-[color:var(--color-text-tertiary)] truncate">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {trailing}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9 ring-1 ring-[color:var(--color-border-soft)]",
            },
          }}
        />
      </div>
    </div>
  );
}
