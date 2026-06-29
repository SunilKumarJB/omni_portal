FROM python:3.12-slim

# Install uv from the official image — no pip, no build-essential needed
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy dependency manifest and lockfile first so Docker caches this layer
COPY pyproject.toml uv.lock ./

# Install runtime deps only (dev group excluded), using the pinned lockfile
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

RUN mkdir -p storage

EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
