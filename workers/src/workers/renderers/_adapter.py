"""Shared adapter boundary for legacy Modal renderer entrypoints."""
from __future__ import annotations

from pathlib import Path


def render_manifest(params: dict) -> dict:
    """Render a serialized manifest through the canonical API adapter."""
    from api.schemas.render_manifest import RenderManifest
    from api.services.intel.render_plan_adapter import render_clip

    manifest_payload = params.get("manifest")
    if not isinstance(manifest_payload, dict):
        raise ValueError("renderer params must contain a serialized 'manifest' object")
    output_dir = params.get("output_dir")
    if not isinstance(output_dir, str) or not output_dir:
        raise ValueError("renderer params must contain a non-empty 'output_dir'")

    manifest = RenderManifest.model_validate(manifest_payload)
    result = render_clip(
        manifest,
        output_dir=Path(output_dir),
        timeout_s=float(params.get("timeout_s", 120.0)),
    )
    return result.model_dump(mode="json")
