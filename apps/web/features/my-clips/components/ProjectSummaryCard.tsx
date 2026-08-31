"use client";

import { memo } from "react";
import { cn } from "@/features/design-system/utils/cn";
import {
  Card,
  Typography,
  Badge,
  AppIcon,
} from "@/features/design-system";
import type { Project } from "../types";

interface ProjectSummaryCardProps {
  project: Project;
  className?: string;
}

/**
 * ProjectSummaryCard — displays project-level metadata.
 *
 * Shows: original video name, upload date, clip count,
 * total processing time, and target platforms.
 */
export const ProjectSummaryCard = memo(function ProjectSummaryCard({
  project,
  className,
}: ProjectSummaryCardProps) {
  return (
    <Card dense className={cn("", className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Video name */}
        <div className="flex items-center gap-2 min-w-0">
          <AppIcon
            name="film"
            size="md"
            className="text-[color:var(--color-accent-green)] shrink-0"
          />
          <div className="min-w-0">
            <Typography variant="caption" className="text-[color:var(--color-text-tertiary)]">
              Video
            </Typography>
            <p className="text-sm font-medium text-[color:var(--color-text-primary)] truncate">
              {project.videoName}
            </p>
          </div>
        </div>

        {/* Upload date */}
        <div className="flex items-center gap-2">
          <AppIcon
            name="clock"
            size="sm"
            className="text-[color:var(--color-text-tertiary)] shrink-0"
          />
          <div>
            <Typography variant="caption" className="text-[color:var(--color-text-tertiary)]">
              Uploaded
            </Typography>
            <p className="text-sm text-[color:var(--color-text-secondary)]">{project.uploadDate}</p>
          </div>
        </div>

        {/* Clip count */}
        <div>
          <Typography variant="caption" className="text-[color:var(--color-text-tertiary)]">
            Clips
          </Typography>
          <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            {project.clipCount}
          </p>
        </div>

        {/* Processing time */}
        <div>
          <Typography variant="caption" className="text-[color:var(--color-text-tertiary)]">
            Processing
          </Typography>
          <p className="text-sm text-[color:var(--color-text-secondary)]">{project.processingTime}</p>
        </div>

        {/* Platforms */}
        <div>
          <Typography variant="caption" className="text-[color:var(--color-text-tertiary)] mb-1">
            Platforms
          </Typography>
          <div className="flex flex-wrap gap-1">
            {project.platforms.map((p) => {
              const labels: Record<string, string> = {
                youtube_shorts: "YT Shorts",
                tiktok: "TikTok",
                instagram_reels: "IG Reels",
              };
              return (
                <Badge key={p} variant="info">
                  {labels[p] ?? p}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
});
