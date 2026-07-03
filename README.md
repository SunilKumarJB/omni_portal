# 🎬 The Omni Portal — Gemini Omni Video Generator

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Gemini%20Enterprise-4285F4?style=flat&logo=google-cloud&logoColor=white)](https://cloud.google.com/products/gemini)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

**The Omni Portal** is an executive-ready, fixed-viewport control deck built for **Gemini Omni** (`gemini-omni-flash-preview`) video generation on the **Gemini Enterprise Agent Platform** (formerly Vertex AI).

The platform provides a 5-step interactive wizard designed for live presentations, executive demonstrations, and multi-modal video creation workflows: choose a cinematic scenario, specify multilingual dialogue with lip-sync, capture or upload character portraits, synchronize audio tracks, and generate high-definition shareable videos.

> **Model:** `gemini-omni-flash-preview` is a public preview model on the Gemini Enterprise Agent Platform. Enable the platform's API on your GCP project and you're ready to go. No GCP access? Toggle **Test Mode** in the sidebar (or set `TEST_MODE=true` in `backend/.env`) to run the full wizard end-to-end with a mocked video.

---

## ✨ Features

- 🎬 **Scenario Presets & Custom Prompts**: Pre-built cinematic templates (Cyberpunk, Anime, Film Noir, Claymation, etc.) with video previews.
- 🗣️ **Multilingual Dialogue & Lip-Sync**: Native speech instruction prompt synthesis across 10 languages (*English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi*).
- 👤 **Presenter Workbench**: Character-to-video reference mapping via preset avatars, webcam photo capture, or portrait image uploads.
- 🎵 **Multimodal Audio Sync**: Synchronize video generation with uploaded audio files, live microphone recordings, or ambient music.
- ☁️ **Native Gemini Enterprise Integration**: Direct communication with the Gemini Enterprise Interactions API supporting both **Google Application Default Credentials (ADC)** and **API Keys**.
- 🧪 **Offline Test Mode**: Built-in mock mode allowing instant frontend-local generation without GCP infrastructure or API charges.
- 📱 **Share & Delivery Hub**: Instant HD video playback, downloadable MP4s, QR code generation for mobile sharing, render metadata, and prompt details.
- 🖥️ **Fixed-Viewport Control Deck**: Designed for 1280x720+ presentation displays with no page-level scrolling.

---

## 📖 How to Use the App (Step-by-Step User Guide)

The Omni Portal features a fixed-viewport, 5-step control deck designed for live executive presentations and multi-modal video synthesis.

### Step 1: Select Scenario Template & Visual Theme
Choose from curated cinematic scenarios (Cyberpunk, Anime, Film Noir, Claymation, etc.) or write a custom video prompt. Each scenario includes instant local video previews and aspect ratio controls.

![Step 1: Scenario Selection](docs/assets/screenshots/step-1-scenario-cards.png)

*Selected Scenario Details:*
![Step 1: Selected Scenario](docs/assets/screenshots/step-1-scenario-selected.png)

---

### Step 2: Dialogue & Multilingual Lip-Sync
Enter the line of dialogue you want your character to speak. Select from **10 supported languages** (*English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi*). Gemini Omni automatically synthesizes the speech and generates frame-accurate lip-sync.

![Step 2: Dialogue & Language Selection](docs/assets/screenshots/step-2-dialogue.png)

---

### Step 3: Presenter Workbench (Character Reference)
Choose your presenter character using preset avatars, upload a custom portrait photo, or capture a live webcam photo. This portrait serves as the character reference for the video.

![Step 3: Presenter Workbench](docs/assets/screenshots/step-3-presenter.png)

---

### Step 4: Audio Track Integration (Optional)
Optionally attach audio to guide video rhythm. Select preset audio tracks, record live microphone voiceovers, or upload custom audio files.

![Step 4: Audio Integration](docs/assets/screenshots/step-4-audio.png)

---

### Step 5: Review & Generate
Review your final video specs, character reference, prompt parameters, and target language. Click the animated **Generate** button to launch Gemini Enterprise video generation (or use **Test Mode** for instant offline mocks).

![Step 5: Review & Generate](docs/assets/screenshots/step-5-review-generate.png)

---

### Result Delivery & Mobile QR Sharing
Watch your HD video in the built-in player, download the MP4 file, copy the share link, or **scan the QR code** on any mobile phone to instantly view and play the video on mobile devices!

![Result Delivery Hub](docs/assets/screenshots/result-delivery-layout.png)

---

## 🏗️ Project Structure

```text
omni_portal/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application entrypoint
│   │   ├── config.py                  # Pydantic environment settings
│   │   ├── api/routes/                # API route handlers (/generate, /videos, /assets)
│   │   ├── models/                    # Pydantic schemas and request models
│   │   └── services/
│   │       ├── omni_service.py        # Gemini Enterprise Interactions API client
│   │       ├── storage_service.py     # GCS and local storage backends
│   │       ├── db_service.py          # Firestore and local database backends
│   │       └── qr_service.py          # Mobile QR code generation
│   ├── Dockerfile                     # Backend container setup
│   ├── pyproject.toml                 # Dependencies (uv)
│   └── uv.lock                        # Locked dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/                     # Home wizard & VideoView pages
│   │   ├── components/                # Wizard step components & Shadcn UI
│   │   └── lib/                       # API client, prompt formatters, types
│   ├── public/assets/                 # Static presets (videos, characters, audio)
│   ├── Dockerfile                     # Nginx production frontend container
│   ├── nginx.conf                     # Production Nginx reverse proxy configuration
│   ├── tsconfig.json                  # Strict TypeScript configuration
│   └── vite.config.ts                 # Vite dev server & proxy setup
├── docs/                              # Architecture and state documentation
├── deploy-cloud-run.sh                # Automated Cloud Run deployment script
├── deploy-firebase.sh                 # Firebase Hosting deployment script
├── docker-compose.yml                 # Docker Compose full-stack setup
├── Makefile                           # Root task runner
└── README.md                          # Main documentation
```

---

## 🛠️ Prerequisites

Ensure you have the following tools installed on your system:

- **Node.js**: `v18.0.0` or higher
- **Python**: `3.12` or higher
- **`uv`**: Fast Python package installer ([Install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **Google Cloud SDK (`gcloud`)**: Required for real GCP / Gemini Enterprise Agent Platform deployment ([Install gcloud](https://cloud.google.com/sdk/docs/install))

---

## 🚀 Quick Start (Local Setup)

### 1. Bootstrap Workspace Dependencies

Run `make install` from the project root to install all backend (`uv`) and frontend (`npm`) dependencies:

```bash
make install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your settings:

```env
# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GCS_BUCKET_NAME=your-gcs-bucket-name

# Gemini / Omni Settings (Gemini Enterprise Agent Platform)
GEMINI_MODEL=gemini-omni-flash-preview
REGION=global
# Optional: GEMINI_API_KEY=your-gemini-api-key

# Storage & DB Mode (set to "local" for zero-cloud runs)
STORAGE_BACKEND=local
DB_BACKEND=local

# Set to true for quick local testing without GCP calls
TEST_MODE=false
```

### 3. Start Development Servers

Start both the backend (FastAPI) and frontend (Vite) concurrently:

```bash
make start
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## ☁️ Gemini Enterprise Agent Platform & Gemini Omni Setup

To use **real Gemini Omni video generation**, complete the following setup steps on Google Cloud Platform:

### Step 1: Enable the required APIs
Ensure the Gemini Enterprise Agent Platform API is enabled in your GCP project:

```bash
gcloud services enable aiplatform.googleapis.com storage.googleapis.com firestore.googleapis.com --project=YOUR_PROJECT_ID
```

### Step 2: Authenticate Local Environment

You can authenticate using either **Application Default Credentials (ADC)** or a **Gemini API Key**:

#### Option A: Application Default Credentials (Recommended)
Log in with your GCP identity:

```bash
gcloud auth application-default login
```

#### Option B: API Key
If using an API key, set `GEMINI_API_KEY` in your `backend/.env`:

```env
GEMINI_API_KEY=AIzaSy...
```

---

## 🧪 Local Test Mode (Offline Demo)

If you are giving a live demo without active GCP connectivity or want to test UI flows without incurring API fees:

1. In the sidebar of the web app, toggle **Test Mode** to `ON`.
2. Complete the 5-step wizard and click **Generate**.
3. The app will simulate real generation progress and deliver a mock video instantly!

Alternatively, enable Test Mode globally in `backend/.env`:

```env
TEST_MODE=true
```

---

## 🚢 Production Deployment Guide (Cloud Run + Firebase Hosting)

For a full production deployment with working mobile QR codes:
- **Backend**: Deployed to **Google Cloud Run** (handles Gemini Omni model generation & FastAPI routes).
- **Frontend**: Deployed to **Firebase Hosting** (provides an HTTPS domain required for mobile QR scanning).

---

### Step 1: Deploy Backend to Cloud Run

Set your GCP environment variables and run the included deployment script:

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_LOCATION="us-central1"
export GCS_BUCKET_NAME="your-gcs-bucket-name"

./deploy-cloud-run.sh
```

This builds and deploys the backend container (`omni-video-backend`) to Cloud Run with `--no-cpu-throttling` so multi-minute background video generation tasks run without interruption.

Note down your deployed **Backend URL** (e.g., `https://omni-video-backend-xyz.a.run.app`).

---

### Step 2: Deploy Frontend to Firebase Hosting

Firebase Hosting provides a secure HTTPS URL (`https://<project-id>.web.app`) required for mobile phones to scan and open video pages.

1. **Enable Firebase** (One-time setup): Open [console.firebase.google.com](https://console.firebase.google.com/), click **Add project**, select your GCP project, and click **Add Firebase**.
2. **Deploy Frontend**:

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
./deploy-firebase.sh
```

Your frontend is now live at `https://your-gcp-project-id.web.app`!

---

### Step 3: Wire Backend & Frontend (Enable Mobile QR Codes)

Update your Cloud Run backend settings to set `FRONTEND_URL` and CORS:

```bash
gcloud run services update omni-video-backend \
  --region us-central1 \
  --update-env-vars "FRONTEND_URL=https://your-gcp-project-id.web.app,ALLOWED_ORIGINS=https://your-gcp-project-id.web.app"
```

Everything is wired up! Every video generated will produce a mobile-scannable QR code encoding `https://your-gcp-project-id.web.app/video/<request_id>`.

---

### 📦 Alternative Deployment Methods (Optional)

<details>
<summary><b>Option A: Docker Compose (Local / Virtual Machine)</b></summary>

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
</details>

<details>
<summary><b>Option B: Standalone Cloud Run Frontend</b></summary>

You can also deploy both frontend and backend to Cloud Run using `./deploy-cloud-run.sh`. The script automatically wires backend CORS and QR URLs to the frontend Cloud Run URL.
</details>

---

## 📋 Environment Variables Reference

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Google Cloud Project ID | `""` |
| `GCP_LOCATION` | Default GCP region | `us-central1` |
| `GCS_BUCKET_NAME` | Cloud Storage bucket name for generated videos | `your-gcs-bucket-name` |
| `GEMINI_MODEL` | Gemini Enterprise Agent Platform model identifier | `gemini-omni-flash-preview` |
| `REGION` | Model interactions region (`global` recommended) | `global` |
| `GEMINI_API_KEY` | Optional API key (skip if using ADC) | `""` |
| `OMNI_ENDPOINT_URL` | Optional custom endpoint URL template | `""` |
| `STORAGE_BACKEND` | Storage strategy (`local` or `gcs`) | `local` |
| `DB_BACKEND` | Metadata database backend (`local` or `firestore`) | `local` |
| `TEST_MODE` | If `true`, returns mock generation results | `false` |
| `BASE_URL` | Backend URL for links and QR generation | `http://localhost:8000` |
| `FRONTEND_URL` | Frontend URL for CORS configuration | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:5173,http://localhost:3000` |

---

## 🛠️ Makefile Commands

From the repo root:

| Command | Action |
| :--- | :--- |
| `make install` | Install all dependencies (`uv sync` + `npm install`) |
| `make start` | Run backend and frontend dev servers concurrently |
| `make start-be` | Start backend dev server only (`uvicorn`) |
| `make start-fe` | Start frontend dev server only (`vite`) |
| `make lint` | Lint codebase (Ruff for backend, Biome for frontend) |
| `make format` | Format codebase (Ruff for backend, Biome for frontend) |
| `make check` | Execute full check pipeline (`format` ➔ `lint` ➔ `format`) |
| `make clean` | Reset build outputs, caches, and virtual environments |

---

## 📄 License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

---

## 👥 Authors

- [Sunil Kumar](https://www.linkedin.com/in/sunilkumar88/)
- [Vanshika Bansal](https://www.linkedin.com/in/vanshika-bansal-dataenthu/)
- [Adhish Thite](https://www.linkedin.com/in/adhish-thite/)

---

*Built with Gemini, Veo, Imagen & FFmpeg on Google Cloud. A Gemini use-case demonstration. Not an official Google product.*
