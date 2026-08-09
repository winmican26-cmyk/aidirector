"""Scene analysis worker — Modal-side wrapper over the adapter.

This file is allowed to import OmegaClips indirectly via the adapter. It
should NOT contain OmegaClips business logic — the boundary is the adapter
at `apps/api/src/api/services/intel/scene_analysis_adapter.py`.

Two entrypoints:
  - `analyze_video_fixture`: runs the phase-2 OmegaClips integration path
    (scoreboard change tracking over a synthetic OCR fixture). Useful for
    local probes and CI smoke tests; does NOT require a video file.
  - `analyze_video`: production entrypoint that downloads the R2 source, runs
    the strict-real orchestrator, and writes typed scenes and candidates back.
"""

from __future__ import annotations

from workers.modal_app import app, intel_image, secrets


@app.function(image=intel_image, secrets=secrets, timeout=120, memory=2048)
def analyze_video_fixture(upload_id: str, fixture_reads: list[dict]) -> dict:
    """Runs the real OmegaClips ScoreboardChangeTracker path over a fixture sequence.

    Returns the raw SceneAnalysisResult as a dict so the dispatcher can
    persist it on the AI Director side without round-tripping pydantic
    across the Modal boundary.
    """
    from api.services.intel.scene_analysis_adapter import analyze_video

    result = analyze_video(
        upload_id=upload_id,
        source_uri="fixture://memory",
        fixture_reads=fixture_reads,
    )
    return result.model_dump(mode="json")


@app.function(image=intel_image, secrets=secrets, timeout=1800, memory=8192)
def analyze_video(job_id: str, upload_r2_key: str, tenant_slug: str) -> dict:
    """Phase 3: full-video orchestrator.

    Pipeline:
      1. Load Job from DB
      2. Download source from R2
      3. Run scene analysis through the strict-real OmegaClips orchestrator
      4. Persist Scene + ClipCandidate rows
      5. Return result summary

    Missing R2 configuration, missing source media, unavailable OmegaClips,
    or an incomplete highlight artifact fail the job. Synthetic production
    candidates are deliberately never created.
    """
    import tempfile
    import uuid as _uuid
    from pathlib import Path

    from sqlalchemy import select
    from sqlalchemy.orm import Session

    from api.db import engine
    from api.models import Job as JobModel

    assert engine is not None, "DATABASE_URL must be set for analyze_video"

    log = __import__("logging").getLogger(__name__)
    log.info("analyze_video: job=%s r2_key=%s", job_id, upload_r2_key)

    with Session(engine) as db:
        job = db.execute(
            select(JobModel).where(JobModel.id == _uuid.UUID(job_id))
        ).scalar_one_or_none()
        if job is None:
            raise ValueError(f"Job {job_id} not found")

        # Download source from R2
        tmp_dir = Path(tempfile.mkdtemp())
        source_path = tmp_dir / (Path(upload_r2_key).name or "source.mp4")
        try:
            from api.config import get_settings
            from api.services import r2 as r2_svc

            if r2_svc.is_r2_configured():
                import boto3

                s = get_settings()
                client = boto3.client(
                    "s3",
                    endpoint_url=f"https://{s.r2_account_id}.r2.cloudflarestorage.com",
                    aws_access_key_id=s.r2_access_key_id,
                    aws_secret_access_key=s.r2_secret_access_key,
                )
                client.download_file(s.r2_bucket, upload_r2_key, str(source_path))
            else:
                log.error("R2 is not configured; refusing synthetic scene output")
                source_path = None

            if source_path is None:
                raise RuntimeError(
                    "R2 is not configured; refusing to create synthetic candidates for a production job"
                )

            # Run the real OmegaClips pipeline and read its typed event artifact.
            candidates = _run_omega_clips(job_id, source_path, tmp_dir)
            scenes_written = 0
            candidates_written = 0
            for i, c in enumerate(candidates):
                scene_row = _Scene(
                    id=_uuid.uuid4(),
                    job_id=job.id,
                    tenant_id=job.tenant_id,
                    t_start=float(c.get("start_s", c.get("t_start", i * 30.0))),
                    t_end=float(c.get("end_s", c.get("t_end", i * 30.0 + 15.0))),
                    kind=c.get("kind", c.get("label", "highlight")),
                    arc_position=c.get("arc_position", "climax"),
                    intensity=float(c.get("intensity", c.get("fi_score", 7.0)) / 10.0),
                    importance=float(c.get("importance", c.get("fi_score", 7.0)) / 10.0),
                    signals=c.get("signals", {"source": "omega_clips"}),
                )
                db.add(scene_row)
                db.flush()
                scenes_written += 1

                cand_row = _ClipCandidate(
                    id=_uuid.uuid4(),
                    job_id=job.id,
                    tenant_id=job.tenant_id,
                    scene_id=scene_row.id,
                    t_start=scene_row.t_start,
                    t_end=scene_row.t_end,
                    confidence_score=float(c.get("fi_score", c.get("confidence_score", 7.0))),
                    quality_score=float(c.get("fi_score", c.get("quality_score", 7.0))),
                    platform_score=float(c.get("fi_score", c.get("platform_score", 7.0))),
                    scores=c.get("scores", {"rank_score": float(c.get("fi_score", 7.0))}),
                )
                db.add(cand_row)
                candidates_written += 1

            db.commit()
            log.info(
                "analyze_video: job=%s persisted %d scenes, %d candidates",
                job_id,
                scenes_written,
                candidates_written,
            )
            return {
                "job_id": job_id,
                "status": "complete",
                "scenes": scenes_written,
                "candidates": candidates_written,
            }
        except Exception:
            db.rollback()
            job = db.execute(
                select(JobModel).where(JobModel.id == _uuid.UUID(job_id))
            ).scalar_one_or_none()
            if job is not None:
                job.status = "failed"
                job.error = "Scene analysis failed; inspect worker logs for details"
                db.commit()
            raise
        finally:
            import shutil

            shutil.rmtree(tmp_dir, ignore_errors=True)


# Lazy imports to avoid circular deps at module level inside Modal
def _Scene(*args, **kwargs):
    from api.models import Scene

    return Scene(*args, **kwargs)


def _ClipCandidate(*args, **kwargs):
    from api.models import ClipCandidate

    return ClipCandidate(*args, **kwargs)


def _run_omega_clips(job_id: str, source_path, workspace_root) -> list[dict]:
    """Run OmegaClips and normalize its highlight packaging artifact."""
    import json
    from pathlib import Path

    from football_pipeline.config import PipelineConfig
    from football_pipeline.orchestrator import FootballPipelineOrchestrator

    job_dir = Path(workspace_root) / f"omega_{job_id}"
    config = PipelineConfig(
        explicit_input_path=str(source_path),
        workspace_dir=Path(workspace_root),
        pipeline_execution_mode="strict_real_only",
        strict_real_blocks_synthetic_generation=True,
        strict_real_blocks_reconstructed_outputs=True,
        final_render_export_enabled=False,
        render_execution_enabled=False,
        publishing_layer_enabled=False,
        direct_publishing_enabled=False,
    )
    result = FootballPipelineOrchestrator(cfg=config).run_full_pipeline(
        str(source_path), job_id=job_id, job_dir=job_dir
    )
    if result.get("status") != "complete":
        raise RuntimeError(f"OmegaClips analysis failed: {result.get('error', result.get('blockers'))}")

    artifact = job_dir / "debug" / "highlight_packaging_summary.json"
    if not artifact.exists():
        raise RuntimeError(f"OmegaClips did not produce {artifact.name}")
    payload = json.loads(artifact.read_text(encoding="utf-8"))
    events = payload.get("events", [])
    if not events:
        raise RuntimeError("OmegaClips produced no highlight candidates")
    return [
        {
            "start_s": event.get("clip_start_sec", 0.0),
            "end_s": event.get("clip_end_sec", 0.0),
            "fi_score": event.get("packaging_quality_score", 0.0) * 10.0,
            "label": event.get("event_type_label", "highlight"),
            "signals": {"omega_event": event},
        }
        for event in events
    ]
