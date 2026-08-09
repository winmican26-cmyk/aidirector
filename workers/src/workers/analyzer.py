"""Scene Analyzer worker — wraps OmegaClips' FootballPipelineOrchestrator.

Reads an upload_id from the control plane, downloads the source from R2, runs
the full OmegaClips analysis pipeline, persists scenes/events to the AI
Director Postgres, and signals readiness for the Director Agent.
"""
from __future__ import annotations

import modal

from workers.modal_app import app, intel_image, secrets


@app.function(image=intel_image, secrets=secrets, timeout=1800, memory=8192)
def analyze_scene(job_id: str, upload_r2_key: str) -> dict[str, str]:
    """Compatibility entrypoint delegating to the canonical scene worker."""
    from workers.scene_analysis_worker import analyze_video

    local_call = getattr(analyze_video, "local", analyze_video)
    result = local_call(job_id, upload_r2_key, "football")
    return {
        "job_id": str(result.get("job_id", job_id)),
        "status": str(result.get("status", "unknown")),
        "scenes": str(result.get("scenes", 0)),
        "candidates": str(result.get("candidates", 0)),
    }
