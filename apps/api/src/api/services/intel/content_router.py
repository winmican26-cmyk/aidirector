"""Routes content to intelligence without changing shared infrastructure."""
from __future__ import annotations

from pathlib import Path
import re
import tempfile

from api.content_types import ContentType, normalize_content_type
from api.services.intel.podcast_intelligence import ConversationSegment, analyze_segments


def analyze_content(content_type: str | None, upload_id: str, source_uri: str, *, transcript: list[ConversationSegment] | None = None):
    """Return content-specific analysis; Football remains on its existing adapter."""
    kind: ContentType = normalize_content_type(content_type)
    if kind == "podcast":
        if transcript is None:
            transcript = _transcribe_segments(source_uri)
        result = analyze_segments(upload_id, transcript)
        return result, kind
    from api.services.intel.scene_analysis_adapter import analyze_video
    return analyze_video(upload_id, source_uri), kind


def _transcribe_segments(source_uri: str) -> list[ConversationSegment]:
    """Build speaker-agnostic conversation segments from a local media file."""
    source = Path(source_uri)
    if not source.is_file():
        raise FileNotFoundError(f"Podcast source is not available locally: {source_uri}")

    from api.services.transcribe import transcribe_to_srt

    with tempfile.TemporaryDirectory(prefix="aidirector_podcast_") as tmp:
        srt_path = Path(tmp) / "transcript.srt"
        result = transcribe_to_srt(source, 0.0, _probe_duration(source), srt_path)
        if result.engine == "fallback":
            raise RuntimeError("Podcast transcription is unavailable; configure faster-whisper")
        return _parse_srt_segments(srt_path)


def _probe_duration(source: Path) -> float:
    import json
    import shutil
    import subprocess

    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe is required for podcast analysis")
    proc = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "json", str(source)],
        capture_output=True,
        text=True,
        timeout=30,
        check=True,
    )
    duration = float(json.loads(proc.stdout)["format"]["duration"])
    if duration <= 0:
        raise RuntimeError("Podcast media has no usable duration")
    return duration


def _parse_srt_segments(path: Path) -> list[ConversationSegment]:
    block_pattern = re.compile(
        r"(?P<start>\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(?P<end>\d{2}:\d{2}:\d{2},\d{3})\s+(?P<text>.+)",
        re.DOTALL,
    )

    def seconds(value: str) -> float:
        hours, minutes, rest = value.split(":")
        whole, millis = rest.split(",")
        return int(hours) * 3600 + int(minutes) * 60 + int(whole) + int(millis) / 1000

    segments: list[ConversationSegment] = []
    for block in path.read_text(encoding="utf-8").split("\n\n"):
        match = block_pattern.search(block.strip())
        if not match:
            continue
        text = " ".join(match.group("text").split()).strip()
        if text.startswith("[") and text.endswith("]"):
            continue
        speaker = None
        label = re.match(r"^(?:\[([^\]]+)\]|([A-Za-z][\w -]{1,32})):\s*(.+)$", text)
        if label:
            speaker = (label.group(1) or label.group(2)).strip().lower()
            text = label.group(3).strip()
        segments.append(
            ConversationSegment(
                start=seconds(match.group("start")),
                end=seconds(match.group("end")),
                text=text,
                speaker=speaker,
            )
        )
    if not segments:
        raise RuntimeError("Podcast transcription produced no speech segments")
    return segments
