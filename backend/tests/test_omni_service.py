import time
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.services import omni_service


@pytest.mark.asyncio
async def test_token_caching():
    # Reset token cache first
    omni_service._token_cache = None
    omni_service._token_expiry = 0.0

    mock_creds = MagicMock()
    mock_creds.token = "test_access_token"
    mock_creds.expiry = datetime.now(timezone.utc)

    # Expiry is set to 1 hour in the future
    mock_creds.expiry = MagicMock()
    mock_creds.expiry.replace.return_value.timestamp.return_value = time.time() + 3600

    with patch("google.auth.default", return_value=(mock_creds, None)) as mock_default:
        # 1. Fetch token for the first time
        token1 = await omni_service._get_cached_token()
        assert token1 == "test_access_token"
        assert mock_default.call_count == 1
        assert mock_creds.refresh.call_count == 1

        # 2. Fetch token again - should return cached value without refreshing!
        token2 = await omni_service._get_cached_token()
        assert token2 == "test_access_token"
        assert mock_default.call_count == 1  # Should NOT be called again!
