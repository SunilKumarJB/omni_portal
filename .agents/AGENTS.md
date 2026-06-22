# Project Rules

## Tech Stack Preferences

- **Package Managers**: For this workspace, use the package manager matching the existing lockfile (e.g., `npm` since `package-lock.json` is present). Do not use `bun` unless explicitly requested or for entirely new standalone sub-projects.

## Testing Backend Connectivity

To verify if the GCP backend APIs (Gemini Pro and Gemini Omni) are authenticated and working under real mode:
1. Run `make test-connection` in the `backend/` directory.
2. This runs the connectivity script at [backend/scripts/test_api_calls.py](file:///Users/adhishthite/Projects/GLM/omni_portal/backend/scripts/test_api_calls.py) which uploads a sample image to test Gemini Pro, then triggers a video generation to verify Omni.

## Unified Makefile Interface

The root directory contains a unified [Makefile](file:///Users/adhishthite/Projects/GLM/omni_portal/Makefile) to manage the entire full-stack project. Always use these commands for local operations:

* **`make install`**: Bootstraps the workspace by installing all dependencies for both backend and frontend.
* **`make start`**: Starts both the frontend and backend development servers concurrently in a single shell session using `concurrently`.
* **`make start-be`**: Starts only the backend dev server (FastAPI).
* **`make start-fe`**: Starts only the frontend dev server (Vite/React).
* **`make format`**: Formats the entire codebase (Ruff for backend, Biome for frontend).
* **`make lint`**: Lints the entire codebase (Ruff for backend, Biome for frontend).
* **`make test`**: Runs the test suite across both frontend and backend.
* **`make check`**: Runs the full verification pipeline: `format ➔ lint ➔ test ➔ format`.
* **`make test-connection`**: Executes the live backend API connectivity test script to verify GCP model responses.
* **`make clean`**: Resets and cleans build folders, virtual environments, and caches across the project.
