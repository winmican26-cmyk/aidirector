"""Unit tests for services/intel/ranking_feedback_adapter.apply_feedback_to_rank_score

The pure function that lets prior engagement nudge a clip's rank score.
Guarantees under test (from the module docstring):
  - structural-dominant: |adjustment| never exceeds ENGAGEMENT_WEIGHT_CAP (0.15)
  - confidence-gated: engagement_confidence < CONFIDENCE_THRESHOLD (0.30) ⇒ adjustment 0
  - neutral midpoint: engagement_score 0.5 ⇒ no pull
  - deterministic + reversible: same (base, view) ⇒ same outcome
  - final_rank_score clamped to [0, 1]
  - feature_version flows through
"""
from __future__ import annotations

import uuid

import pytest

from api.models import MaturityState
from api.services.intel.ranking_feedback_adapter import (
    CONFIDENCE_THRESHOLD,
    ENGAGEMENT_WEIGHT_CAP,
    PerformanceFeatureView,
    apply_feedback_to_rank_score,
)


def _view(
    *,
    engagement_score: float,
    engagement_confidence: float,
    feature_version: str = "v1",
    maturity_state: MaturityState = MaturityState.STABLE,
) -> PerformanceFeatureView:
    return PerformanceFeatureView(
        export_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        feature_version=feature_version,
        maturity_state=maturity_state,
        engagement_confidence=engagement_confidence,
        normalized_view_rate=None,
        normalized_completion_rate=None,
        normalized_watch_time=None,
        replay_rate=None,
        share_rate=None,
        engagement_score=engagement_score,
        experiment_group_id=None,
    )


class TestNoOpPaths:
    def test_none_view_returns_base_unchanged(self):
        out = apply_feedback_to_rank_score(0.62, None)
        assert out.engagement_adjustment == 0.0
        assert out.final_rank_score == 0.62
        assert out.feedback_applied is False
        assert out.feature_version == "n/a"

    def test_below_confidence_threshold_returns_base_unchanged(self):
        view = _view(
            engagement_score=0.95,  # strongly positive …
            engagement_confidence=CONFIDENCE_THRESHOLD - 0.01,  # … but untrusted
        )
        out = apply_feedback_to_rank_score(0.50, view)
        assert out.engagement_adjustment == 0.0
        assert out.final_rank_score == 0.50
        assert out.feedback_applied is False
        assert out.breakdown["reason"] == "below_confidence_threshold"

    def test_neutral_engagement_produces_no_adjustment(self):
        view = _view(engagement_score=0.5, engagement_confidence=1.0)
        out = apply_feedback_to_rank_score(0.4, view)
        assert out.engagement_adjustment == 0.0
        assert out.final_rank_score == 0.4
        # confidence is above threshold, so the function still reports it "applied"
        # the *math*, it just resolved to zero
        assert out.feedback_applied is False


class TestCapAndDirection:
    def test_max_positive_adjustment_is_capped(self):
        view = _view(engagement_score=1.0, engagement_confidence=1.0)
        out = apply_feedback_to_rank_score(0.50, view)
        assert out.engagement_adjustment == pytest.approx(ENGAGEMENT_WEIGHT_CAP)
        assert out.final_rank_score == pytest.approx(0.65)
        assert out.feedback_applied is True

    def test_max_negative_adjustment_is_capped(self):
        view = _view(engagement_score=0.0, engagement_confidence=1.0)
        out = apply_feedback_to_rank_score(0.50, view)
        assert out.engagement_adjustment == pytest.approx(-ENGAGEMENT_WEIGHT_CAP)
        assert out.final_rank_score == pytest.approx(0.35)

    @pytest.mark.parametrize("engagement_score", [0.0, 0.25, 0.5, 0.75, 1.0])
    def test_adjustment_never_exceeds_cap(self, engagement_score: float):
        view = _view(engagement_score=engagement_score, engagement_confidence=1.0)
        out = apply_feedback_to_rank_score(0.5, view)
        assert abs(out.engagement_adjustment) <= ENGAGEMENT_WEIGHT_CAP + 1e-9

    def test_partial_confidence_scales_adjustment_down(self):
        full = apply_feedback_to_rank_score(
            0.5, _view(engagement_score=1.0, engagement_confidence=1.0)
        )
        half = apply_feedback_to_rank_score(
            0.5, _view(engagement_score=1.0, engagement_confidence=0.5)
        )
        assert abs(half.engagement_adjustment) < abs(full.engagement_adjustment)
        # centered=+1, scaled=0.5, capped = 0.5 * 0.15 = 0.075
        assert half.engagement_adjustment == pytest.approx(0.075)


class TestClamping:
    def test_final_score_clamped_to_upper_bound(self):
        view = _view(engagement_score=1.0, engagement_confidence=1.0)
        out = apply_feedback_to_rank_score(0.95, view)
        assert out.final_rank_score == 1.0

    def test_final_score_clamped_to_lower_bound(self):
        view = _view(engagement_score=0.0, engagement_confidence=1.0)
        out = apply_feedback_to_rank_score(0.05, view)
        assert out.final_rank_score == 0.0


class TestDeterminismAndMetadata:
    def test_same_inputs_same_outcome(self):
        view = _view(engagement_score=0.8, engagement_confidence=0.9)
        a = apply_feedback_to_rank_score(0.55, view)
        b = apply_feedback_to_rank_score(0.55, view)
        assert a == b

    def test_feature_version_flows_through(self):
        view = _view(
            engagement_score=0.8, engagement_confidence=0.9, feature_version="v3"
        )
        out = apply_feedback_to_rank_score(0.55, view)
        assert out.feature_version == "v3"

    def test_guard_constants_surface_in_outcome(self):
        view = _view(engagement_score=0.8, engagement_confidence=0.9)
        out = apply_feedback_to_rank_score(0.55, view)
        assert out.confidence_threshold == CONFIDENCE_THRESHOLD
        assert out.engagement_weight_cap == ENGAGEMENT_WEIGHT_CAP
        assert "base" in out.explanation.lower()
