# Project Rules

## Product & Demo Context

- This project is for a Google Marketing Live demo in India, shown to a Google-level CxO audience from reputed organizations.
- The UI will be cast from a Mac or Chromebook to a larger screen, so design choices should support confident live presentation: readable typography, spacious layouts, low-friction flows, and no small-screen-only assumptions.
- The product purpose is to showcase Gemini Omni model capabilities, especially character-driven cinematic video generation, multilingual dialogue, lip-sync, and polished shareable output.
- Treat this as an executive demo surface, not a generic SaaS dashboard or playful toy. Favor refined, premium, Google-brand-aligned interactions that make the model capability feel reliable and impressive.
- For local smoke tests that trigger generation, turn on **Test mode** in the sidebar first. Test Mode performs frontend-local mock generation and avoids real GCP/Omni calls.
- The wizard is a fixed-viewport, no-scroll control deck for 1280x720+ casted screens. Do not add page-level scrolling or tall stacked sections that require a CxO audience to scroll.
- The left Omni Portal brand control resets the wizard to Step 1. Keep it as an action, not a same-route no-op link.

## Tech Stack Preferences

- **Package Managers**: For this workspace, use the package manager matching the existing lockfile (e.g., `npm` since `package-lock.json` is present). Do not use `bun` unless explicitly requested or for entirely new standalone sub-projects.
- **Backend package management**: The backend uses **uv** with `pyproject.toml` (not `pip` + `requirements.txt`). Never add packages directly with `pip install` — add them to `[project.dependencies]` in `backend/pyproject.toml` and run `uv lock && uv sync --group dev`.
- **Frontend language**: The frontend is strict TypeScript. Do not add `.js` or `.jsx` under `frontend/src`. Use `.ts` / `.tsx`, keep `npm run typecheck` green, and keep config files typed (`vite.config.ts`, `tailwind.config.ts`, `postcss.config.ts`).
- **Prompt display**: `[REF_Character]` is an internal generation placeholder. It can remain in internal preset prompts sent to generation, but never render it directly in user-facing UI. Use `formatPromptForDisplay()` from `frontend/src/lib/prompt.ts`.
- **Repository identity**: This repo should use Adhish Thite's Google identity for local commits: `Adhish Thite <adhishthite@google.com>`.

## Frontend Design Rules

- Preserve the fixed control-deck layout: `h-dvh`, `overflow-hidden`, `min-h-0`, and pinned action bars where needed.
- Every step must fit within the screen without page-level scrolling at 1280x720.
- Cards should use their full area with clear internal sections, larger typography, and useful metadata. Avoid giant empty panels with tiny labels.
- Keep Step 2 language cards, Step 3 presenter workbench, Step 4 audio tiles, Step 5 review, and the result delivery panel aligned to the same executive-demo density.
- Use semantic token classes from `index.css`/Tailwind (`bg-background`, `text-muted-foreground`, `border-border`, etc.) rather than raw hex or one-off colors.
- Use Google colors intentionally: step accents, the top gradient, final-step ring, and Generate hover border. Do not turn the whole UI into blue chrome.
- The Generate button has an animated Google-color border on hover/focus. Preserve the treatment for both real Omni generation and Test Mode.
- Do not use browser screenshots for every iteration. The user will visually verify and send screenshots when needed. Use TypeScript/build checks by default unless a screenshot is explicitly useful or requested.

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
* **`make clean`**: Resets and cleans build folders, virtual environments, and caches across the project.

## Backend Rules

- All backend targets run through `uv run` — never call `.venv/bin/python` or `.venv/bin/pytest` directly.
- Dev dependencies (ruff, pytest, pytest-asyncio) live in `[dependency-groups] dev` in `backend/pyproject.toml`.
- `backend/uv.lock` is committed and must stay in sync with `pyproject.toml`. After any dep change: `cd backend && uv lock`.
- Async tests use `pytest-asyncio` with `asyncio_mode = "auto"` (configured in `pyproject.toml` under `[tool.pytest.ini_options]`).
- The backend resolves deps from PyPI only (`[[tool.uv.index]]` is pinned in `pyproject.toml` to avoid private index conflicts).
