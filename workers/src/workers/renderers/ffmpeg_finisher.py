"""FFmpeg Finisher — thin Modal wrapper over OmegaClips RG-4 render_execution."""
from __future__ import annotations

from workers.contracts import FFmpegFinisherParams, RenderResult
from workers.modal_app import app, intel_image, secrets


@app.function(image=intel_image, secrets=secrets, timeout=600, memory=4096)
def finish_with_ffmpeg(job_id: str, scene_id: str, params: dict) -> dict:
    """Render a manifest using the canonical FFmpeg adapter."""
    from workers.renderers._adapter import render_manifest

    return render_manifest(params)
