from types import SimpleNamespace

import pytest

from api.services.intel.content_router import analyze_content, _parse_srt_segments
from api.content_types import normalize_content_type
from api.services.intel.podcast_intelligence import ConversationSegment, analyze_segments
from api.services.director_plan_builder import build_director_plan
from api.services.render_manifest_builder import build_manifests


def test_content_type_routing_is_explicit():
    assert normalize_content_type("podcast") == "podcast"
    with pytest.raises(FileNotFoundError, match="not available locally"):
        analyze_content("podcast", "u1", "source.mp4")


def test_podcast_analysis_detects_speakers_and_scores_moments():
    result = analyze_segments("u1", [
        ConversationSegment(0, 8, "What is the most important lesson you learned?", "host"),
        ConversationSegment(8, 22, "The truth is I made a surprising mistake and learned from it.", "guest"),
    ])
    assert result.speakers == ("host", "guest")
    assert result.scenes[0].kind == "question_answer"
    assert result.candidates[0].scores["content_type"] == "podcast"
    assert result.candidates[0].scores["speaker"] in {"host", "guest"}


def test_podcast_director_plan_uses_conversation_defaults():
    candidate = SimpleNamespace(
        id="candidate-1", t_start=0, t_end=12, confidence_score=0.9,
        quality_score=0.8, platform_score=0.7, rationale="strong statement",
        scores={"scene_kind": "strong_statement"},
    )
    plan = build_director_plan(
        upload_id="u1", job_id="j1", candidates=[candidate],
        platform_targets=["youtube_shorts"], content_type="podcast",
    )
    selected = plan.selected_candidates[0]
    assert plan.content_type == "podcast"
    assert selected.caption_style == "documentary"
    assert selected.crop_strategy == "smart"
    assert selected.render_style == "conversation"


def test_podcast_manifest_preserves_content_metadata_and_vertical_variant():
    candidate = SimpleNamespace(
        id="candidate-1", t_start=0, t_end=12, confidence_score=0.9,
        quality_score=0.8, platform_score=0.7, rationale="strong statement",
        scores={"scene_kind": "strong_statement"},
    )
    plan = build_director_plan(
        upload_id="u1", job_id="j1", candidates=[candidate],
        platform_targets=["youtube_shorts"], content_type="podcast",
    )
    result = build_manifests(plan=plan, source_uri="source.mp4", tenant_id="t1", tenant_slug="demo")
    assert len(result.manifests) == 1
    manifest = result.manifests[0]
    assert manifest.aspect_ratio == "9:16"
    assert manifest.execution_metadata["content_type"] == "podcast"
    assert manifest.caption_mode == "documentary"
    assert manifest.crop_mode == "smart"


def test_srt_parser_preserves_explicit_speaker_labels(tmp_path):
    transcript = tmp_path / "transcript.srt"
    transcript.write_text(
        "1\n00:00:00,000 --> 00:00:03,000\n[Host]: Why does this matter?\n\n"
        "2\n00:00:03,000 --> 00:00:07,000\nGuest: Because the truth is surprising.\n",
        encoding="utf-8",
    )
    segments = _parse_srt_segments(transcript)
    assert [(s.speaker, s.text) for s in segments] == [
        ("host", "Why does this matter?"),
        ("guest", "Because the truth is surprising."),
    ]


def test_vertical_variants_force_smart_crop():
    candidate = SimpleNamespace(
        id="candidate-vertical", t_start=0, t_end=12, confidence_score=0.9,
        quality_score=0.8, platform_score=0.7, rationale="strong statement",
        scores={},
    )
    plan = build_director_plan(
        upload_id="u1", job_id="j1", candidates=[candidate],
        platform_targets=["youtube_shorts"], content_type="football",
    )
    selected = plan.selected_candidates[0].model_copy(update={"crop_strategy": "fit"})
    plan = plan.model_copy(update={"selected_candidates": [selected]})
    result = build_manifests(plan=plan, source_uri="source.mp4", tenant_id="t1", tenant_slug="demo")
    assert result.manifests[0].aspect_ratio == "9:16"
    assert result.manifests[0].crop_mode == "smart"
