# The Omni Portal

A full-stack video generation platform powered by **Google Gemini Omni** (`gemini-omni-flash-preview`) via the Vertex Interactions API. Users walk through a 5-step wizard to produce cinematic, AI-generated videos using text prompts, character reference images, audio, and existing video inputs.

---

## Features

- **Text-to-Video (T2V)** — generate from a prompt with style + theme modifiers
- **Reference-to-Video (R2V)** — pass product (`[REF_PRODUCT]`) and character (`[REF_CHARACTER]`) images as visual anchors
- **Audio-driven generation** — upload a voice/audio track; Omni handles lip-sync
- **Video-to-Video editing (V2V)** — supply an existing video and describe the transformation (style transfer, character swap, product placement, etc.)
- **Gemini 2.5 Pro prompt analysis** — auto-suggests styles, themes, and detailed prompts from a product image
- **QR code output** — every generated video gets a shareable QR link
- **Test Mode** — full wizard flow with placeholder video, zero GCP calls needed

---

## Project Structure

```
omni_portal/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Pydantic settings (reads .env)
│   │   ├── api/routes/
│   │   │   ├── generate.py          # /api/generate/* endpoints
│   │   │   ├── videos.py            # /api/videos/:id endpoint
│   │   │   └── assets.py            # /api/assets/* (presets + uploads)
│   │   ├── models/schemas.py        # Pydantic data models
│   │   └── services/
│   │       ├── omni_service.py      # Gemini Omni Interactions API (video gen)
│   │       ├── gemini_service.py    # Gemini 2.5 Pro prompt analysis
│   │       ├── storage_service.py   # GCS + local storage abstraction
│   │       ├── db_service.py        # Firestore + local DB abstraction
│   │       └── qr_service.py        # QR code generation
│   ├── storage/                     # Local file storage (STORAGE_BACKEND=local)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                         # Local config (not committed)
│   └── .env.example                 # Config template
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx             # 5-step generation wizard
│   │   │   └── VideoView.jsx        # QR-linked video result page
│   │   └── components/
│   │       ├── PromptSelector.jsx   # Step 1 — scenario / prompt
│   │       ├── DialogueSelector.tsx # Step 2 — dialogue + language
│   │       ├── CharacterSelector.jsx# Step 3 — character preset / camera / upload
│   │       ├── AudioSelector.jsx    # Step 4 — audio preset / record / upload
│   │       └── ReviewGenerate.jsx   # Step 5 — review & submit
│   └── public/assets/
│       ├── characters/              # SVG avatar placeholders (char_01–06.svg)
│       ├── audio/                   # MP3 preview placeholders (see README inside)
│       └── videos/                  # MP4 thumbnail placeholders (see README inside)
├── docker-compose.yml
├── deploy-cloud-run.sh
└── README.md
```

---

## Quick Start — Test Mode (no GCP required)

### 1. Backend

```bash
cd backend
cp .env.example .env
# In .env: set TEST_MODE=true  (already the default in .env.example)

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enable the **Test Mode** toggle in the header. The wizard runs end-to-end with a sample placeholder video — no API keys needed.

---

## Local Dev with Real GCP

### Prerequisites

1. GCP project with these APIs enabled:
   - **Vertex AI API** (for Gemini Omni + Gemini 2.5 Pro)
   - **Cloud Storage API**
   - **Cloud Firestore API** (optional — use `DB_BACKEND=local` to skip)

2. Gemini Omni access — the `gemini-omni-flash-preview` model is currently gated. Ensure your project has access, then note which **environment** you have access to (`autopush`, `staging`, or `prod`).

3. GCS bucket:
   ```bash
   gsutil mb gs://your-bucket-name
   ```

4. Firestore database in **Native mode** (or skip with `DB_BACKEND=local`).

5. Authenticate locally:
   ```bash
   gcloud auth application-default login
   ```

### Configure `.env`

```env
# GCP
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GCS_BUCKET_NAME=your-bucket-name

# Gemini Omni (Vertex Interactions API)
OMNI_PROJECT_ID=            # leave empty to reuse GCP_PROJECT_ID
OMNI_MODEL=gemini-omni-flash-preview
OMNI_ENVIRONMENT=autopush   # autopush | staging | prod
OMNI_REGION=global          # global | us-central1
OMNI_MAX_WAIT_SECONDS=600
OMNI_DEFAULT_DURATION=10
OMNI_DEFAULT_ASPECT_RATIO=16:9

# Storage + DB
STORAGE_BACKEND=gcs
DB_BACKEND=firestore
TEST_MODE=false
```

Run backend and frontend as in the Test Mode steps above (without `TEST_MODE=true`).

---

## Docker Compose

```bash
# Place ADC credentials at the repo root as gcp-credentials.json
docker-compose up --build
```

| Service  | URL                            |
|----------|--------------------------------|
| Frontend | http://localhost:3000          |
| Backend  | http://localhost:8000/docs     |

---

## Cloud Run Deployment

```bash
export GCP_PROJECT_ID=your-project-id
chmod +x deploy-cloud-run.sh
./deploy-cloud-run.sh
```

The script builds Docker images, pushes to Artifact Registry, and deploys both services to Cloud Run with the required environment variables.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `GCP_PROJECT_ID` | *(required)* | GCP project for Gemini + Storage |
| `GCP_LOCATION` | `us-central1` | Vertex AI region for Gemini 2.5 Pro |
| `GCS_BUCKET_NAME` | `omni-video-demo` | GCS bucket for assets + generated videos |
| `GEMINI_PRO_MODEL` | `gemini-2.5-pro` | Prompt analysis model |
| `GEMINI_FLASH_MODEL` | `gemini-2.0-flash` | Image understanding model |
| `OMNI_PROJECT_ID` | *(empty → GCP_PROJECT_ID)* | Project with Omni access |
| `OMNI_MODEL` | `gemini-omni-flash-preview` | Video generation model |
| `OMNI_ENVIRONMENT` | `autopush` | API environment: `autopush` / `staging` / `prod` |
| `OMNI_REGION` | `global` | Interactions API region |
| `OMNI_MAX_WAIT_SECONDS` | `600` | Polling timeout for video generation |
| `OMNI_DEFAULT_DURATION` | `10` | Video duration in seconds (1–10) |
| `OMNI_DEFAULT_ASPECT_RATIO` | `16:9` | `16:9` or `9:16` |
| `STORAGE_BACKEND` | `local` | `local` or `gcs` |
| `DB_BACKEND` | `local` | `local` or `firestore` |
| `LOCAL_STORAGE_PATH` | `./storage` | Path for local file storage |
| `TEST_MODE` | `false` | Skip all GCP calls, use placeholder video |
| `BASE_URL` | `http://localhost:8000` | Backend base URL (used in QR links) |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend base URL (used in QR links) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS allowed origins (comma-separated) |

---

## Generation Workflow

```
User wizard (5 steps)
│
├── Step 1 · Scenario ── POST /api/generate/prompts
│                           └─ Gemini 2.5 Pro → style / theme / prompt suggestions
│
├── Step 2 · Dialogue ── optional spoken line + language
│
├── Step 3 · Character ── preset SVG avatar  OR  camera capture  OR  upload image
│
├── Step 4 · Audio ───── preset track  OR  microphone recording  OR  upload file
│
└── Step 5 · Review ──── POST /api/generate/video
                            │
                            ├─ Uploads assets → GCS (or local storage)
                            ├─ Spawns background task
                            └─ Background task:
                                 ├─ Reads asset bytes from storage
                                 ├─ Calls Omni Interactions API
                                 │    ├─ Prompt enriched with [REF_PRODUCT] / [REF_CHARACTER] tags
                                 │    ├─ Reference images passed as media inputs
                                 │    ├─ Audio passed for lip-sync (if uploaded)
                                 │    └─ Source video passed for V2V editing (if uploaded)
                                 ├─ Polls until complete (background=true mode)
                                 ├─ Decodes base64 video → saves to storage
                                 └─ Updates status → frontend polls /api/generate/status/:id
```

---

## GCP Services Used

| Service | Purpose |
|---|---|
| Vertex Interactions API (`gemini-omni-flash-preview`) | Video generation (T2V / R2V / V2V / audio-driven) |
| Vertex AI Gemini 2.5 Pro | Structured prompt analysis from product images |
| Vertex AI Gemini 2.0 Flash | Fast image understanding (character descriptions) |
| Cloud Storage (GCS) | Asset uploads + generated video storage |
| Cloud Firestore | Request tracking, status, and result persistence |
| Cloud Run | Serverless hosting for backend + frontend |
| Artifact Registry | Docker image storage for deployments |

---

## Placeholder Assets

The `frontend/public/assets/` folder holds placeholder content for the three selection screens:

| Folder | Content | Used by |
|---|---|---|
| `characters/` | `char_01–06.svg` — styled SVG avatars | CharacterSelector presets |
| `audio/` | Drop `audio_01–06.mp3` here to enable inline preview players | AudioSelector presets |
| `videos/` | Drop `template_*.mp4` + `poster_*.jpg` here for scenario card thumbnails | PromptSelector template cards |

See the `README.md` inside each folder for exact file naming and format requirements. All three screens degrade gracefully when files are absent — no errors, just fallback to emoji/accent-strip.
