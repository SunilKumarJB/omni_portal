import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services import gemini_service
from app.models.schemas import PromptsResponse


@pytest.mark.asyncio
async def test_generate_prompts_from_image():
    image_bytes = b"fake_image_data"
    mime_type = "image/png"

    # Mock return response from Gemini
    mock_response = MagicMock()
    mock_response.text = """
    {
      "product_description": "A luxury botanical mascara.",
      "suggested_styles": [
        {"id": "cinematic", "name": "Cinematic", "description": "Epic shots", "icon": "🎬"}
      ],
      "suggested_themes": [
        {"id": "nature", "name": "Nature & Fresh", "description": "Organic greens", "color": "#065f46"}
      ],
      "sample_prompts": [
        {"id": "sp_01", "text": "Close up of mascara bottle.", "style_hint": "cinematic"}
      ]
    }
    """

    mock_generate_content = AsyncMock(return_value=mock_response)
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = mock_generate_content

    with (
        patch("app.services.gemini_service._get_client", return_value=mock_client),
        patch("app.services.gemini_service.settings") as mock_settings,
    ):
        mock_settings.TEST_MODE = False
        mock_settings.GEMINI_PRO_MODEL = "gemini-2.5-pro"

        result = await gemini_service.generate_prompts_from_image(
            image_bytes, mime_type
        )

        # Verify result structure
        assert isinstance(result, PromptsResponse)
        assert result.product_description == "A luxury botanical mascara."
        assert len(result.styles) == 1
        assert result.styles[0].id == "cinematic"
        assert len(result.themes) == 1
        assert result.themes[0].id == "nature"

        # Verify the async call was made
        assert mock_generate_content.call_count == 1
        call_args = mock_generate_content.call_args[1]
        assert call_args["model"] == "gemini-2.5-pro"
        assert call_args["config"].response_mime_type == "application/json"


@pytest.mark.asyncio
async def test_analyze_image_for_video():
    image_bytes = b"fake_character_image"

    mock_response = MagicMock()
    mock_response.text = (
        "A professional presenter standing in front of a blue background."
    )

    mock_generate_content = AsyncMock(return_value=mock_response)
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = mock_generate_content

    with (
        patch("app.services.gemini_service._get_client", return_value=mock_client),
        patch("app.services.gemini_service.settings") as mock_settings,
    ):
        mock_settings.TEST_MODE = False
        mock_settings.GEMINI_FLASH_MODEL = "gemini-2.0-flash"

        result = await gemini_service.analyze_image_for_video(image_bytes)

        assert (
            result == "A professional presenter standing in front of a blue background."
        )
        assert mock_generate_content.call_count == 1
        call_args = mock_generate_content.call_args[1]
        assert call_args["model"] == "gemini-2.0-flash"
