"""
QR code generation service.
"""
import io
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask
from PIL import Image
from app.config import settings


def generate_qr_bytes(url: str, size: int = 10, border: int = 2) -> bytes:
    """Generate a styled QR code PNG as bytes."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)

    try:
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            color_mask=RadialGradiantColorMask(
                center_color=(139, 92, 246),
                edge_color=(6, 182, 212),
            ),
        )
    except Exception:
        img = qr.make_image(fill_color="#8b5cf6", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_qr_bytes_simple(url: str) -> bytes:
    """Fallback simple QR code."""
    qr = qrcode.make(url)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    return buf.getvalue()


def video_page_url(request_id: str) -> str:
    return f"{settings.FRONTEND_URL}/video/{request_id}"
