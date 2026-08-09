"""HyperFrames Renderer — NEW pipeline, not in OmegaClips. GPU.

High-motion sports edits: RIFE/FILM frame interpolation for slow-mo, GPU-
accelerated kinetic text, impact zooms, velocity edits. The visual moat.
"""
from __future__ import annotations

import modal

from workers.modal_app import app, intel_image, secrets

# Override base image with GPU-friendly variants (torch + CUDA) for HyperFrames.
hyperframes_image = (
    intel_image
    .pip_install("torch>=2.5", "torchvision>=0.20")
)


@app.function(
    image=hyperframes_image,
    secrets=secrets,
    gpu="A10G",
    timeout=900,
    memory=16384,
)
def render_hyperframes(job_id: str, scene_id: str, params: dict) -> dict:
    """Use the validated CPU adapter until a dedicated GPU renderer is enabled."""
    from workers.renderers._adapter import render_manifest

    return render_manifest(params)
