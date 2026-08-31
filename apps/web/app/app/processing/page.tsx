"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/brand/LogoMark";
import { analytics } from "@/services/analytics";
import { PollingTransport, type JobEvent } from "@/services/job-events";
import { useApi } from "@/lib/api/runtime";
import type { JobStatus } from "@/lib/api";
import { PageContainer, Card, Typography, Button, ProgressIndicator, AppIcon } from "@/features/design-system";

const ACTIVITY_MESSAGES = [
  "Watching your video",
  "Finding key moments",
  "Creating captions",
  "Preparing vertical clips",
  "Getting everything ready for download",
] as const;
const TIPS = [
  "You can safely leave this page—we'll keep working.",
  "Longer matches naturally take a little more time.",
  "Your original video is never modified.",
] as const;
const TERMINAL = new Set<JobStatus>(["succeeded", "failed", "cancelled", "expired"]);
const TIMEOUT_MS = 270_000;

const statusCopy: Record<JobStatus, { title: string; detail: string }> = {
  queued: { title: "Waiting to start...", detail: "Your job is queued for processing." },
  running: { title: "Creating your clips...", detail: "We're processing your video right now." },
  retrying: { title: "Retrying processing...", detail: "The worker is retrying this job." },
  succeeded: { title: "Your clips are ready!", detail: "Processing completed successfully." },
  failed: { title: "Processing failed", detail: "Something went wrong while processing this video." },
  cancelled: { title: "Processing cancelled", detail: "This job was cancelled before completion." },
  expired: { title: "Processing expired", detail: "This job expired before it could complete." },
};

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { endpoints, mode } = useApi();
  const jobId = searchParams.get("job_id");
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);
  const completedTracked = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!jobId || mode !== "live" || !endpoints) return () => { mountedRef.current = false; };

    const transport = new PollingTransport(endpoints);
    const unsubscribe = transport.subscribe(jobId, (event: JobEvent) => {
      if (!mountedRef.current) return;
      if (event.type === "error") {
        setConnectionError(true);
        return;
      }
      setConnectionError(false);
      const nextStatus = event.type === "events" ? event.events.status : event.view.job.status;
      setStatus(nextStatus);
      if (nextStatus === "succeeded" && !completedTracked.current) {
        completedTracked.current = true;
        analytics.track("processing_completed");
      }
    });
    return () => { mountedRef.current = false; unsubscribe(); };
  }, [endpoints, jobId, mode]);

  useEffect(() => {
    if (!jobId || !status || TERMINAL.has(status)) return;
    const started = Date.now();
    const interval = setInterval(() => setElapsed(Date.now() - started), 1000);
    const timeout = setTimeout(() => setShowTimeout(true), TIMEOUT_MS);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [jobId, status]);

  useEffect(() => {
    if (status !== "succeeded") return;
    const timer = setTimeout(() => router.push("/app/clips?success=true"), 1500);
    return () => clearTimeout(timer);
  }, [router, status]);

  useEffect(() => {
    const interval = setInterval(() => setActivityIndex((value) => (value + 1) % ACTIVITY_MESSAGES.length), 4000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => setTipIndex((value) => (value + 1) % TIPS.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const goToUpload = useCallback(() => router.push("/app/upload"), [router]);
  const copy = status ? statusCopy[status] : null;
  const missingJob = !jobId;
  const unavailable = mode !== "live" || !endpoints;
  const recoverableError = missingJob || unavailable || connectionError;
  const terminalFailure = status === "failed" || status === "cancelled" || status === "expired";

  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col items-center mb-12">
        <LogoMark className="h-12 w-12 mb-4" />
        <Typography variant="hero" className="text-center">{copy?.title ?? (missingJob ? "No processing job found" : "Connecting to processing...")}</Typography>
        <Typography variant="subtitle" className="text-center mt-2">{copy?.detail ?? "We are connecting to the backend job."}</Typography>
      </div>

      <Card className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <ProgressIndicator progress={status === "succeeded" ? 100 : recoverableError || terminalFailure ? null : null} size="xl" showPercentage={false} label={status ? `Job status: ${status}` : "Connecting to job"} />
        </div>
        <Typography variant="title" className="mb-2" aria-live="polite" aria-atomic="true">
          {status ? status : missingJob ? "Missing job ID" : connectionError ? "Connection lost" : "Connecting"}
        </Typography>

        {recoverableError && !terminalFailure && (
          <div role="alert" className="mt-4 rounded-xl border border-[color:var(--color-status-warning)]/30 bg-[color:var(--color-status-warning)]/10 px-4 py-3 text-sm text-[color:var(--color-status-warning)]">
            {missingJob ? "This page needs a processing job ID." : unavailable ? "Live processing is unavailable in fixture mode." : "We could not reach the job event endpoint. We will not report success until it reconnects."}
          </div>
        )}
        {terminalFailure && <div role="alert" className="mt-4 rounded-xl border border-[color:var(--color-status-failed)]/30 bg-[color:var(--color-status-failed)]/10 px-4 py-3 text-sm text-[color:var(--color-status-failed)]">{copy?.detail}</div>}
        {showTimeout && !TERMINAL.has(status ?? "queued") && <div role="alert" className="mt-4 rounded-xl border border-[color:var(--color-status-warning)]/30 bg-[color:var(--color-status-warning)]/10 px-4 py-3 text-sm text-[color:var(--color-status-warning)]">Taking longer than expected. The backend job is still not complete.</div>}

        {!recoverableError && !terminalFailure && status !== "succeeded" && (
          <div className="mt-6 bg-[color:var(--color-surface-2)] rounded-xl px-4 py-3 border border-[color:var(--color-border-strong)]" aria-live="polite" aria-atomic="true">
            <div className="flex items-center justify-center gap-2"><AppIcon name="refresh" size="sm" className="text-[color:var(--color-accent-green)] motion-safe:animate-spin" /><span className="text-sm font-medium text-[color:var(--color-text-primary)]">{ACTIVITY_MESSAGES[activityIndex]}</span></div>
          </div>
        )}
        {status && !TERMINAL.has(status) && elapsed > 0 && <Typography variant="small" className="mt-4">Connected to backend job {jobId}</Typography>}
      </Card>

      <div className="mt-8 text-center max-w-sm"><Typography variant="caption" className="mb-2 block"><AppIcon name="info" size="sm" className="inline-block mr-1.5 text-[color:var(--color-text-tertiary)] align-text-bottom" />Tip</Typography><p className="text-sm text-[color:var(--color-text-secondary)] leading-relaxed" aria-live="polite">{TIPS[tipIndex]}</p></div>
      {(missingJob || unavailable || connectionError || terminalFailure || status === "succeeded") && <Button variant="secondary" size="md" className="mt-8" onClick={goToUpload}>{status === "succeeded" ? "Start another clip" : "Back to New Clip"}</Button>}
    </PageContainer>
  );
}
