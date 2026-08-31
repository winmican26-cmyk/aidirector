/**
 * Pure mapper: `JobView` (API composite) → presentation shapes for the
 * My Clips screen (`Clip` / `Project`).
 *
 * Kept dependency-free (no hooks, no network) so it is unit-testable and
 * deterministic. The page wires it to `useJobView` + download infra.
 */
import { formatSeconds } from "@/lib/format";
import type { Clip, Project } from "@/features/my-clips/types";
import type { ClipCandidate, JobView } from "@/lib/api/types";

/** A downloadable render output for one candidate. */
export interface ClipExportLink {
  clipId: string;
  renderOutputId: string;
  filename?: string;
}

/** Derive the quality score on a 0–10 scale. */
function scoreTo10(candidate: ClipCandidate): number {
  const scores = candidate.scores;
  const final =
    typeof scores?.final_rank_score === "number" ? (scores.final_rank_score as number) : null;
  const source = final ?? candidate.confidence_score ?? candidate.quality_score ?? 0;
  if (!isFinite(source)) return 0;
  return Math.round(source * 10 * 10) / 10;
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-friendly title from the underlying scene kind, fallback to rank. */
function clipTitle(view: JobView, candidate: ClipCandidate, index: number): string {
  const scene = view.scenes.find((s) => s.id === candidate.scene_id);
  const kind = scene?.kind ? capitalize(scene.kind.replace(/_/g, " ")) : null;
  return kind ? `Clip ${index + 1} · ${kind}` : `Clip ${index + 1}`;
}

/** Platforms for a candidate from the director plan, render jobs, or exports. */
function candidatePlatforms(view: JobView, candidateId: string): string[] {
  const selected = view.director_plan?.selected_candidates.find(
    (s) => s.candidate_id === candidateId,
  );
  if (selected?.variants.length) return selected.variants.map((v) => v.platform);
  const renderJobs = view.render_jobs.filter((rj) => rj.candidate_id === candidateId);
  if (renderJobs.length) return [...new Set(renderJobs.map((rj) => rj.platform))];
  return view.director_plan?.platform_targets ?? [];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/** Pipeline elapsed time from first → last usage event. */
function pipelineDuration(view: JobView): string {
  const events = view.usage_events;
  if (!events.length) return "—";
  const first = new Date(events[0].created_at).getTime();
  const last = new Date(events[events.length - 1].created_at).getTime();
  const secs = (last - first) / 1000;
  if (!isFinite(secs) || secs < 0) return "—";
  return formatSeconds(secs);
}

/**
 * Resolve the first download link (render output id + filename) for a
 * candidate. Prefers a succeeded render job; falls back to any render
 * job, then requires an export row.
 */
export function findExportLinkForCandidate(
  view: JobView,
  candidateId: string,
): ClipExportLink | null {
  const renderJob =
    view.render_jobs.find((rj) => rj.candidate_id === candidateId && rj.status === "succeeded") ??
    view.render_jobs.find((rj) => rj.candidate_id === candidateId);
  if (!renderJob) return null;
  const output = view.render_outputs.find((o) => o.render_job_id === renderJob.id);
  if (!output) return null;
  const artifact = view.exports.find(
    (e) => e.render_output_id === output.id && e.export_status !== "failed",
  );
  if (!artifact) return null;
  return { clipId: candidateId, renderOutputId: output.id, filename: artifact.filename };
}

/** Map a JobView to the gallery's `Clip[]`. One clip per candidate. */
export function mapJobViewToClips(view: JobView): Clip[] {
  return view.candidates.map((candidate, index) => {
    const hasExport = findExportLinkForCandidate(view, candidate.id) !== null;
    const failedRender = view.render_jobs.some(
      (rj) => rj.candidate_id === candidate.id && rj.status === "failed",
    );

    let status: Clip["status"];
    if (view.job.status === "failed" || failedRender) status = "failed";
    else if (hasExport) status = "ready";
    else status = "processing";

    return {
      id: candidate.id,
      title: clipTitle(view, candidate, index),
      duration: formatSeconds(candidate.t_end - candidate.t_start),
      score: scoreTo10(candidate),
      platforms: candidatePlatforms(view, candidate.id),
      status,
      createdAt: formatDate(view.job.created_at),
    };
  });
}

/** Map a JobView to the project summary card. */
export function mapJobViewToProject(view: JobView): Project {
  const platforms =
    view.director_plan?.platform_targets ??
    [...new Set(view.exports.map((e) => e.platform))];
  return {
    videoName: view.upload.filename,
    uploadDate: formatDate(view.upload.created_at),
    clipCount: view.candidates.length,
    processingTime: pipelineDuration(view),
    platforms,
  };
}
