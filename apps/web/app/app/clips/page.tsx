"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PageContainer,
  Typography,
  Button,
  EmptyState,
  AppIcon,
} from "@/features/design-system";
import { analytics } from "@/services/analytics";
import { ClipCard } from "@/features/my-clips/components/ClipCard";
import { ProjectSummaryCard } from "@/features/my-clips/components/ProjectSummaryCard";
import { PreviewPanel } from "@/features/my-clips/components/PreviewPanel";
import { FeedbackWidget } from "@/features/feedback";
import {
  findExportLinkForCandidate,
  mapJobViewToClips,
  mapJobViewToProject,
} from "@/features/my-clips/lib/map-job-view";
import { useRecentJobs } from "@/hooks/useRecentJobs";
import { useJobView } from "@/hooks/useJobView";
import { useApi } from "@/lib/api/runtime";
import { downloadExport } from "@/services/export-download";
import { toast } from "@/stores/toast-store";
import type { Clip } from "@/features/my-clips/types";

/**
 * My Clips page — Screen 3 of the 3-screen creator-first experience.
 *
 * Answers three questions immediately:
 *   1. Which clips are ready?
 *   2. Which are the best? (quality score badges)
 *   3. How do I download or share them?
 *
 * Data source: the live `JobView` composite (via `useJobView`), mapped to
 * presentation shapes by `map-job-view.ts`. In fixture mode (no
 * `NEXT_PUBLIC_API_URL`) the same hook serves demo data and sets
 * `fixturesUsed` so the UI can show a "demo data" banner.
 *
 * Accessibility:
 * - Keyboard navigation throughout the gallery
 * - Focus management for the preview panel (via BottomSheet)
 * - Screen reader labels on all action buttons
 */
export default function MyClipsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { endpoints } = useApi();

  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Resolve the job: explicit ?jobId= param wins, else the most recent job.
  const paramJobId = searchParams.get("jobId");
  const { jobs, loading: jobsLoading } = useRecentJobs();
  const jobId = paramJobId ?? jobs[0]?.id ?? null;
  const { view, loading: viewLoading, fixturesUsed } = useJobView(jobId);

  const clips = useMemo(() => (view ? mapJobViewToClips(view) : []), [view]);
  const project = useMemo(() => (view ? mapJobViewToProject(view) : null), [view]);
  const loading = jobsLoading || viewLoading;

  // Check for success param from processing page redirect
  useEffect(() => {
    const fromProcessing = searchParams.get("success") === "true";
    if (fromProcessing) {
      setShowSuccess(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      // Clean up the URL
      window.history.replaceState(null, "", "/app/clips");
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // ── Handlers ──────────────────────────────────────────────

  const handlePreview = useCallback((clip: Clip) => {
    setSelectedClip(clip);
    analytics.track("clip_preview_opened", { clipId: clip.id, clipTitle: clip.title });
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedClip(null);
  }, []);

  const handleDownload = useCallback(
    async (clip: Clip) => {
      analytics.track("download_clicked", { clipId: clip.id, clipTitle: clip.title });
      if (!view) return;
      const link = findExportLinkForCandidate(view, clip.id);
      if (!link) {
        toast.info("Not ready yet", "This clip hasn't been exported. Check back in a moment.");
        return;
      }
      const ok = await downloadExport(endpoints, link.renderOutputId, link.filename);
      if (ok) {
        toast.success("Download started", link.filename);
      } else {
        toast.error("Download unavailable", "Couldn't resolve a download link. Try again in a moment.");
      }
    },
    [endpoints, view],
  );

  const handleDownloadAll = useCallback(async () => {
    if (!view) return;
    const links = clips
      .map((clip) => findExportLinkForCandidate(view, clip.id))
      .filter((link): link is NonNullable<typeof link> => link !== null);
    analytics.track("download_all_clicked", { clipCount: links.length });

    if (links.length === 0) {
      toast.info("Nothing to download", "No exported clips yet. Check back in a moment.");
      return;
    }

    let started = 0;
    for (const link of links) {
      if (await downloadExport(endpoints, link.renderOutputId, link.filename)) started += 1;
    }
    if (started === links.length) {
      toast.success("Downloads started", `${started} clip${started === 1 ? "" : "s"} downloading`);
    } else if (started > 0) {
      toast.warning("Some downloads started", `${started} of ${links.length} clips downloading`);
    } else {
      toast.error("Download unavailable", "Couldn't resolve download links. Try again in a moment.");
    }
  }, [clips, endpoints, view]);

  // ── Empty state support ────────────────────────────────────
  const isEmpty =
    searchParams.get("empty") === "1" || (!loading && (!jobId || clips.length === 0));

  // ── Render: Empty State ───────────────────────────────────
  if (isEmpty) {
    return (
      <PageContainer>
        <EmptyState
          icon={AppIcon}
          title="No clips yet"
          description="Upload your first video to generate AI-powered clips. We'll find the best moments and create social-ready clips automatically."
          action={
            <Button
              size="lg"
              variant="primary"
              onClick={() => router.push("/app/upload" as never)}
            >
              <AppIcon name="upload" size="md" />
              Create Your First Project
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // ── Render: Loading ───────────────────────────────────────
  if (loading || !project) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-sm text-[color:var(--color-text-tertiary)]">
          Loading your clips…
        </div>
      </PageContainer>
    );
  }

  // ── Render: Clips Gallery ─────────────────────────────────
  return (
    <PageContainer>
      {/* Demo data banner (fixture mode) */}
      {fixturesUsed && (
        <div
          className="flex items-center gap-2 rounded-2xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] px-5 py-3 mb-8 text-xs text-[color:var(--color-text-secondary)]"
          role="status"
          aria-live="polite"
        >
          <AppIcon name="info" size="sm" />
          <span>
            Showing demo data — connect <code className="font-mono">NEXT_PUBLIC_API_URL</code> to
            see your real projects.
          </span>
        </div>
      )}

      {/* Success Banner */}
      {showSuccess && (
        <div
          className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-status-succeeded)]/30 bg-[color:var(--color-status-succeeded)]/10 px-5 py-4 mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-250"
          role="status"
          aria-live="polite"
        >
          <span className="text-2xl" aria-hidden="true">
            🎉
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[color:var(--color-status-succeeded)]">
              Your clips are ready!
            </p>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              All {clips.length} clip{clips.length === 1 ? "" : "s"} have been generated and
              optimised for your selected platforms.
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="shrink-0 rounded-lg p-1.5 text-[color:var(--color-status-succeeded)] hover:bg-[color:var(--color-status-succeeded)]/15 transition-colors"
            aria-label="Dismiss"
          >
            <AppIcon name="x" size="sm" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Typography variant="hero" className="text-[color:var(--color-text-primary)]">
            My Clips
          </Typography>
          <Typography variant="subtitle" className="mt-1">
            Your AI-generated clips are ready.
          </Typography>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => void handleDownloadAll()}
          >
            <AppIcon name="download" size="md" />
            Download All
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/app/upload" as never)}
          >
            <AppIcon name="upload" size="md" />
            Create Another Project
          </Button>
        </div>
      </div>

      {/* Project Summary */}
      <ProjectSummaryCard project={project} className="mb-10" />

      {/* Clip Gallery */}
      <div>
        <Typography
          variant="sectionTitle"
          className="mb-6"
        >
          Clips
        </Typography>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onPreview={handlePreview}
              onDownload={handleDownload}
            />
          ))}
        </div>
      </div>

      {/* Preview Panel (BottomSheet) */}
      <PreviewPanel
        clip={selectedClip}
        onClose={handleClosePreview}
        onDownload={handleDownload}
      />

      {/* In-app feedback widget — visible when clips are present */}
      <FeedbackWidget />
    </PageContainer>
  );
}
