"use client";

import { memo, useCallback } from "react";
import { cn } from "@/features/design-system/utils/cn";
import {
  Button,
  StatusBadge,
  PlatformBadge,
  Badge,
  AppIcon,
  BottomSheet,
} from "@/features/design-system";
import { toast } from "@/stores/toast-store";
import type { Clip } from "../types";

interface PreviewPanelProps {
  clip: Clip | null;
  onClose: () => void;
  onDownload: (clip: Clip) => void;
}

/**
 * PreviewPanel — shows clip details in a side panel (desktop) or
 * bottom sheet (mobile). Rendered via BottomSheet.
 *
 * Displays:
 * - Large preview area
 * - Clip information (title, duration, score, platforms, status)
 * - Download, Share (placeholder), Copy Link (placeholder) buttons
 */
export const PreviewPanel = memo(function PreviewPanel({
  clip,
  onClose,
  onDownload,
}: PreviewPanelProps) {
  const shareUrl = typeof window === "undefined"
    ? ""
    : clip
      ? `${window.location.origin}/app/clips?clip=${encodeURIComponent(clip.id)}`
      : "";

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: clip?.title ?? "AI Director clip", url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied", "The clip link is ready to share.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Share failed", "Copy the link instead or try again.");
    }
  }, [clip?.title, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied", "The clip link is ready to share.");
    } catch {
      toast.error("Copy failed", "Your browser did not allow clipboard access.");
    }
  }, [shareUrl]);

  if (!clip) return null;

  return (
    <BottomSheet
      open={!!clip}
      onClose={onClose}
      title={clip.title}
    >
      <div className="aspect-video rounded-xl overflow-hidden bg-[color:var(--color-surface-3)] border border-[color:var(--color-border-soft)] mb-6">
        {clip.videoUrl ? (
          <video className="h-full w-full object-contain" src={clip.videoUrl} controls playsInline preload="metadata">
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AppIcon name="play" size="2xl" className="text-[color:var(--color-text-muted)] mx-auto mb-2" />
              <span className="text-xs font-medium text-[color:var(--color-text-tertiary)]">Preview unavailable</span>
            </div>
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-xs font-medium text-[color:var(--color-text-tertiary)] uppercase tracking-wider">
            Duration
          </span>
          <p className="text-sm font-semibold text-[color:var(--color-text-primary)] mt-0.5">
            {clip.duration}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-[color:var(--color-text-tertiary)] uppercase tracking-wider">
            Quality Score
          </span>
          <p className="text-sm font-semibold text-[color:var(--color-text-primary)] mt-0.5 flex items-center gap-1">
            <span className="text-[color:var(--color-accent-gold)]">&#9733;</span>
            {clip.score.toFixed(1)}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-[color:var(--color-text-tertiary)] uppercase tracking-wider">
            Status
          </span>
          <div className="mt-1">
            <StatusBadge status={clip.status} />
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-[color:var(--color-text-tertiary)] uppercase tracking-wider">
            Created
          </span>
          <p className="text-sm text-[color:var(--color-text-primary)] mt-0.5">
            {clip.createdAt}
          </p>
        </div>
      </div>

      {/* Platforms */}
      <div className="mb-6">
        <span className="text-xs font-medium text-[color:var(--color-text-tertiary)] uppercase tracking-wider block mb-2">
          Platforms
        </span>
        <div className="flex flex-wrap gap-1.5">
          {clip.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </div>

      {/* Description / filename */}
      <div className="mb-6 p-3 rounded-xl bg-[color:var(--color-surface-2)] border border-[color:var(--color-border-soft)]">
        <p className="text-xs text-[color:var(--color-text-secondary)] leading-relaxed">
          AI-generated clip from your video. Optimised for vertical viewing
          on social platforms.
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          onClick={() => onDownload(clip)}
        >
          <AppIcon name="download" size="md" />
          Download Clip
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="md"
            variant="secondary"
            className="w-full"
            onClick={() => void handleShare()}
          >
            <AppIcon name="externalLink" size="sm" />
            Share
          </Button>
          <Button
            size="md"
            variant="secondary"
            className="w-full"
            onClick={() => void handleCopyLink()}
          >
            <AppIcon name="link" size="sm" />
            Copy Link
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
});
