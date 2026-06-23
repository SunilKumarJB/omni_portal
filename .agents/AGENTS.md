# Project Rules

## Tech Stack Preferences

- **Package Managers**: For this workspace, use the package manager matching the existing lockfile (e.g., `npm` since `package-lock.json` is present). Do not use `bun` unless explicitly requested or for entirely new standalone sub-projects.
- **Backend package management**: The backend uses **uv** with `pyproject.toml` (not `pip` + `requirements.txt`). Never add packages directly with `pip install` — add them to `[project.dependencies]` in `backend/pyproject.toml` and run `uv lock && uv sync --group dev`.

## Testing Backend Connectivity

To verify if the GCP backend API (Gemini Omni) is authenticated and working under real mode:
1. Run `make test-connection` in the `backend/` directory.
2. This runs the connectivity script at `backend/scripts/test_api_calls.py` which triggers a video generation to verify Omni is reachable.

## Unified Makefile Interface

The root directory contains a unified `Makefile` to manage the entire full-stack project. Always use these commands for local operations:

* **`make install`**: Bootstraps the workspace — installs all backend deps via `uv sync --group dev` and frontend deps via `npm install`.
* **`make start`**: Starts both the frontend and backend development servers concurrently in a single shell session using `concurrently`.
* **`make start-be`**: Starts only the backend dev server (FastAPI via `uv run uvicorn`).
* **`make start-fe`**: Starts only the frontend dev server (Vite/React).
* **`make format`**: Formats the entire codebase (Ruff for backend, Biome for frontend).
* **`make lint`**: Lints the entire codebase (Ruff for backend, Biome for frontend).
* **`make test`**: Runs the test suite across both frontend and backend (`uv run pytest` for backend).
* **`make check`**: Runs the full verification pipeline: `format ➔ lint ➔ test ➔ format`.
* **`make test-connection`**: Executes the live backend API connectivity test script to verify GCP model responses.
* **`make clean`**: Resets and cleans build folders, virtual environments, and caches across the project.

## Backend Rules

- All backend targets run through `uv run` — never call `.venv/bin/python` or `.venv/bin/pytest` directly.
- Dev dependencies (ruff, pytest, pytest-asyncio) live in `[dependency-groups] dev` in `backend/pyproject.toml`.
- `backend/uv.lock` is committed and must stay in sync with `pyproject.toml`. After any dep change: `cd backend && uv lock`.
- Async tests use `pytest-asyncio` with `asyncio_mode = "auto"` (configured in `pyproject.toml` under `[tool.pytest.ini_options]`).
- The backend resolves deps from PyPI only (`[[tool.uv.index]]` is pinned in `pyproject.toml` to avoid private index conflicts).
