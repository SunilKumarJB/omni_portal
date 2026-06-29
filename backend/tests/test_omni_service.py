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


def test_enrich_prompt_speaks_dialogue_in_language():
    out = omni_service._enrich_prompt(
        "A tracking shot of [REF_Character] in the rain",
        dialogue="The city never sleeps.",
        language="hi",
        has_character=True,
    )
    # Dialogue is spoken in the named language with lip-sync
    assert "speaks the following line in Hindi" in out
    assert '"The city never sleeps."' in out
    # Character token already in the prompt -> no duplicate binding instruction added
    assert "Use [REF_Character] as the main character" not in out
    # Quality suffix preserved
    assert "High quality, 4K resolution." in out


def test_enrich_prompt_binds_character_when_token_absent():
    out = omni_service._enrich_prompt(
        "A custom scene with no placeholder",
        has_character=True,
    )
    # Custom prompt lacks the token, so the binding instruction is appended (matching casing)
    assert "Use [REF_Character] as the main character" in out


def test_enrich_prompt_unknown_language_defaults_to_english():
    out = omni_service._enrich_prompt(
        "scene", dialogue="hi there", language="zz", has_character=False
    )
    assert "speaks the following line in English" in out
