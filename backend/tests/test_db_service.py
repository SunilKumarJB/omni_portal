import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services import db_service


@pytest.mark.asyncio
async def test_db_service_local_mode(tmp_path):
    # Patch _LOCAL_DB_PATH to use our temp path for isolation
    mock_db_path = tmp_path / "db"
    with patch("app.services.db_service._LOCAL_DB_PATH", mock_db_path):
        request_id = "test_request_123"
        data = {"prompt": "Test prompt", "style_id": "cinematic"}

        # 1. Test create_request
        await db_service.create_request(request_id, data)

        # Verify file was written
        expected_file = mock_db_path / f"{request_id}.json"
        assert expected_file.exists()

        # 2. Test get_request
        record = await db_service.get_request(request_id)
        assert record is not None
        assert record["request_id"] == request_id
        assert record["prompt"] == "Test prompt"
        assert record["status"] == "pending"
        assert record["progress"] == 0
        assert "created_at" in record

        # 3. Test update_request
        await db_service.update_request(request_id, {"progress": 50, "status": "processing"})

        # Verify update
        updated_record = await db_service.get_request(request_id)
        assert updated_record["progress"] == 50
        assert updated_record["status"] == "processing"


@pytest.mark.asyncio
async def test_db_service_firestore_mode():
    request_id = "test_request_456"
    data = {"prompt": "Test firestore", "style_id": "vibrant"}

    # Mock firestore AsyncClient and documents
    mock_doc = AsyncMock()
    mock_collection = MagicMock()
    mock_db = MagicMock()

    mock_db.collection.return_value = mock_collection
    mock_collection.document.return_value = mock_doc

    # Mock document get return value
    mock_snapshot = MagicMock()
    mock_snapshot.exists = True
    mock_snapshot.to_dict.return_value = {
        "request_id": request_id,
        "status": "pending",
        "progress": 0,
        "prompt": "Test firestore",
    }
    mock_doc.get.return_value = mock_snapshot

    # Patch settings to firestore, and patch _get_firestore
    with (
        patch("app.services.db_service.settings") as mock_settings,
        patch("app.services.db_service._get_firestore", return_value=mock_db),
    ):
        mock_settings.DB_BACKEND = "firestore"
        mock_settings.TEST_MODE = False

        # 1. Test create_request in firestore
        await db_service.create_request(request_id, data)
        assert mock_db.collection.call_count == 1
        mock_db.collection.assert_called_with("video_requests")
        mock_collection.document.assert_called_with(request_id)
        assert mock_doc.set.call_count == 1

        # 2. Test get_request in firestore
        record = await db_service.get_request(request_id)
        assert record is not None
        assert record["prompt"] == "Test firestore"
        assert mock_doc.get.call_count == 1

        # 3. Test update_request in firestore
        await db_service.update_request(request_id, {"progress": 90})
        assert mock_doc.update.call_count == 1
