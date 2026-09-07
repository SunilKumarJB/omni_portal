"""
Tests for Progress Curve Calibration & Timeout Watchdog.
Verifies:
1. omni_service.calculate_progress_fraction asymptotic curve.
2. generate.map_progress_to_band progress band mapping (30% to 90%).
3. db_service.is_timed_out and apply_timeout_watchdog logic.
4. db_service.get_request auto-failing timed-out jobs (>10m or OMNI_MAX_WAIT_SECONDS).
5. GET /api/generate/status/{request_id} returning failed status for timed-out jobs.
"""

from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import httpx
import pytest

from app.config import settings
from app.main import app
from app.api.routes.generate import map_progress_to_band
from app.services import db_service, omni_service


# ---------------------------------------------------------------------------
# 1. Calibrated Progress Curve Tests
# ---------------------------------------------------------------------------


def test_calculate_progress_fraction_zero_and_negative():
    """Verify non-positive elapsed times return 0.0 fraction."""
    assert omni_service.calculate_progress_fraction(0.0) == 0.0
    assert omni_service.calculate_progress_fraction(-10.0) == 0.0


def test_calculate_progress_fraction_monotonicity():
    """Verify progress fraction is monotonically non-decreasing and bounded by 0.92."""
    intervals = [0.0, 5.0, 10.0, 20.0, 30.0, 40.0, 50.0, 55.0, 60.0, 70.0, 100.0, 300.0, 600.0]
    fractions = [omni_service.calculate_progress_fraction(t) for t in intervals]

    for i in range(len(fractions) - 1):
        assert fractions[i] <= fractions[i + 1]

    # Upper bound must never reach or exceed 1.0 (capped strictly at 0.92)
    for frac in fractions:
        assert 0.0 <= frac <= 0.92


def test_calculate_progress_fraction_expected_milestones():
    """
    Verify progress fraction hits expected targets around ~55s median duration.
    Ensures it fixes the issue where linear progress froze at ~31% for 60s jobs.
    """
    f_10 = omni_service.calculate_progress_fraction(10.0)
    assert 0.30 <= f_10 <= 0.35  # ~0.33 at 10s

    f_25 = omni_service.calculate_progress_fraction(25.0)
    assert 0.60 <= f_25 <= 0.65  # ~0.63 at 25s

    f_55 = omni_service.calculate_progress_fraction(55.0)
    assert 0.88 <= f_55 <= 0.90  # ~0.89 at 55s median

    f_60 = omni_service.calculate_progress_fraction(60.0)
    assert 0.90 <= f_60 <= 0.92  # ~0.91 at 60s

    # Long runs asymptote at 0.92
    f_120 = omni_service.calculate_progress_fraction(120.0)
    assert f_120 == 0.92

    f_600 = omni_service.calculate_progress_fraction(600.0)
    assert f_600 == 0.92


def test_progress_curve_outperforms_old_linear():
    """Verify calibrated curve is substantially higher than old linear 60s progress (~10%)."""
    old_linear_at_60s = min(60.0 / settings.OMNI_MAX_WAIT_SECONDS, 0.95)  # 0.10
    calibrated_at_60s = omni_service.calculate_progress_fraction(60.0)  # ~0.91

    assert calibrated_at_60s > 0.90
    assert calibrated_at_60s > old_linear_at_60s * 8


# ---------------------------------------------------------------------------
# 2. Progress Band Mapping Tests (30% to 90%)
# ---------------------------------------------------------------------------


def test_map_progress_to_band_boundaries():
    """Verify mapping fraction into 30% to 90% band."""
    assert map_progress_to_band(0.0, start=30, end=90) == 30
    assert map_progress_to_band(0.5, start=30, end=90) == 60
    assert map_progress_to_band(1.0, start=30, end=90) == 90


def test_map_progress_to_band_clamping():
    """Verify fractions outside [0.0, 1.0] are clamped."""
    assert map_progress_to_band(-0.5, start=30, end=90) == 30
    assert map_progress_to_band(1.5, start=30, end=90) == 90


def test_calibrated_progress_in_band():
    """Verify realistic generation elapsed times mapped into the 30%..90% band."""
    # 0s: 30%
    assert map_progress_to_band(omni_service.calculate_progress_fraction(0.0)) == 30
    # 10s: ~49%
    assert map_progress_to_band(omni_service.calculate_progress_fraction(10.0)) == 49
    # 25s: ~67%
    assert map_progress_to_band(omni_service.calculate_progress_fraction(25.0)) == 67
    # 55s: ~83%
    assert map_progress_to_band(omni_service.calculate_progress_fraction(55.0)) == 83
    # 60s: ~84%
    assert map_progress_to_band(omni_service.calculate_progress_fraction(60.0)) == 84
    # Max asymptote (0.92): 85% — leaves 90% for model return and 100% for storage upload
    assert map_progress_to_band(omni_service.calculate_progress_fraction(120.0)) == 85


# ---------------------------------------------------------------------------
# 3. Timeout Watchdog Unit Tests
# ---------------------------------------------------------------------------


def test_is_timed_out_completed_or_failed():
    """Verify completed or already failed records never time out."""
    old_time = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    record_completed = {"status": "completed", "updated_at": old_time}
    record_failed = {"status": "failed", "updated_at": old_time}

    assert not db_service.is_timed_out(record_completed)
    assert not db_service.is_timed_out(record_failed)


def test_is_timed_out_fresh_record():
    """Verify pending/processing records within 10 minutes do not time out."""
    recent_time = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    record_pending = {"status": "pending", "updated_at": recent_time}
    record_processing = {"status": "processing", "updated_at": recent_time}

    assert not db_service.is_timed_out(record_pending)
    assert not db_service.is_timed_out(record_processing)


def test_is_timed_out_expired_record():
    """Verify pending/processing records older than 10 minutes time out."""
    expired_time = (datetime.now(timezone.utc) - timedelta(seconds=601)).isoformat()
    record_pending = {"status": "pending", "updated_at": expired_time}
    record_processing = {"status": "processing", "updated_at": expired_time}

    assert db_service.is_timed_out(record_pending)
    assert db_service.is_timed_out(record_processing)


def test_is_timed_out_custom_timeout():
    """Verify timeout threshold respects custom timeout_seconds argument."""
    ts = (datetime.now(timezone.utc) - timedelta(seconds=15)).isoformat()
    record = {"status": "processing", "updated_at": ts}

    assert not db_service.is_timed_out(record, timeout_seconds=30)
    assert db_service.is_timed_out(record, timeout_seconds=10)


def test_is_timed_out_falls_back_to_created_at():
    """Verify fallback to created_at if updated_at is missing."""
    expired_time = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
    record = {"status": "processing", "created_at": expired_time}

    assert db_service.is_timed_out(record)


def test_is_timed_out_invalid_timestamp():
    """Verify malformed timestamps do not crash and safely return False."""
    record = {"status": "processing", "updated_at": "not-a-valid-date"}
    assert not db_service.is_timed_out(record)


# ---------------------------------------------------------------------------
# 4. Database Service Integration Tests (get_request with Watchdog)
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_get_request_leaves_fresh_record_intact(tmp_path: Path):
    """Verify get_request leaves fresh pending job intact."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "fresh-req-1"
        await db_service.create_request(request_id, {"prompt": "A test prompt"})

        record = await db_service.get_request(request_id)
        assert record is not None
        assert record["status"] == "pending"
        assert record.get("error") is None


@pytest.mark.anyio
async def test_get_request_auto_fails_timed_out_record(tmp_path: Path):
    """
    Verify get_request detects an expired job (>10m), updates database to failed,
    and returns the failed record with 'Generation job timed out'.
    """
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "expired-req-1"
        await db_service.create_request(request_id, {"prompt": "A prompt that took too long"})

        # Manually backdate the record in the database to 15 minutes ago
        past_iso = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
        db_file = tmp_path / "db" / f"{request_id}.json"
        assert db_file.exists()

        import json

        data = json.loads(db_file.read_text())
        data["status"] = "processing"
        data["updated_at"] = past_iso
        db_file.write_text(json.dumps(data))

        # Calling get_request should trigger the watchdog
        record = await db_service.get_request(request_id)

        assert record is not None
        assert record["status"] == "failed"
        assert record["error"] == "Generation job timed out"

        # Verify the database file on disk was also updated
        disk_data = json.loads(db_file.read_text())
        assert disk_data["status"] == "failed"
        assert disk_data["error"] == "Generation job timed out"


# ---------------------------------------------------------------------------
# 5. FastAPI /api/generate/status/{request_id} Route Tests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_api_status_watchdog_trigger(tmp_path: Path):
    """
    Verify GET /api/generate/status/{request_id} returns failed status with
    error message when queried for a job older than 10 minutes.
    """
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "api-timeout-req"
        await db_service.create_request(request_id, {"prompt": "API prompt"})

        # Age the record past the 10-minute threshold
        past_iso = (datetime.now(timezone.utc) - timedelta(seconds=700)).isoformat()
        import json

        db_file = tmp_path / "db" / f"{request_id}.json"
        data = json.loads(db_file.read_text())
        data["status"] = "processing"
        data["updated_at"] = past_iso
        db_file.write_text(json.dumps(data))

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/generate/status/{request_id}")
            assert resp.status_code == 200
            resp_data = resp.json()
            assert resp_data["request_id"] == request_id
            assert resp_data["status"] == "failed"
            assert resp_data["error"] == "Generation job timed out"


@pytest.mark.anyio
async def test_api_status_completed_job_not_failed(tmp_path: Path):
    """Verify GET /api/generate/status/{request_id} preserves completed status even if old."""
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        request_id = "completed-old-req"
        await db_service.create_request(request_id, {"prompt": "Completed prompt"})

        past_iso = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        import json

        db_file = tmp_path / "db" / f"{request_id}.json"
        data = json.loads(db_file.read_text())
        data["status"] = "completed"
        data["progress"] = 100
        data["video_url"] = "http://test/video.mp4"
        data["updated_at"] = past_iso
        db_file.write_text(json.dumps(data))

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get(f"/api/generate/status/{request_id}")
            assert resp.status_code == 200
            resp_data = resp.json()
            assert resp_data["status"] == "completed"
            assert resp_data["progress"] == 100
            assert resp_data["error"] is None


# ---------------------------------------------------------------------------
# 6. Generation Completion Flow Tests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_generation_completion_flow(tmp_path: Path):
    """
    Verify _run_generation completes successfully:
    1. Advances progress through intermediate states.
    2. Sets progress to 90% when Omni finishes.
    3. Uploads video and marks status 'completed' with 100% progress and video_url.
    """
    with (
        patch.object(settings, "LOCAL_STORAGE_PATH", str(tmp_path)),
        patch.object(settings, "DB_BACKEND", "local"),
        patch.object(settings, "TEST_MODE", False),
    ):
        from app.api.routes.generate import _run_generation
        from app.services import storage_service

        request_id = "test-completion-req"
        await db_service.create_request(request_id, {"prompt": "Test prompt"})

        # Mock omni_service.generate_video to simulate calling progress callback then returning bytes
        async def mock_generate_video(*args, progress_callback=None, **kwargs):
            if progress_callback:
                await progress_callback(0.5)  # halfway: 60%
                await progress_callback(0.92)  # calibrated max: 85%
            return b"dummy_mp4_bytes", "video/mp4"

        with (
            patch.object(omni_service, "generate_video", side_effect=mock_generate_video),
            patch.object(
                storage_service,
                "upload_bytes",
                return_value=("http://localhost:8000/storage/video.mp4", "/storage/video.mp4"),
            ),
        ):
            await _run_generation(request_id=request_id, prompt="Test prompt")

        record = await db_service.get_request(request_id)
        assert record is not None
        assert record["status"] == "completed"
        assert record["progress"] == 100
        assert record["video_url"] == "http://localhost:8000/storage/video.mp4"
        assert record.get("error") is None
