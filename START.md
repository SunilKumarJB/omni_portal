# Omni Video Generator — Quick Start

## Local Dev (Test Mode — no GCP needed)

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set TEST_MODE=true, STORAGE_BACKEND=local, DB_BACKEND=local

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 → Enable **Test Mode** toggle in header

---

## Local Dev with Real GCP

1. Create a GCP project and enable:
   - Vertex AI API
   - Cloud Storage API
   - Cloud Firestore API

2. Create a GCS bucket: `gsutil mb gs://your-bucket-name`

3. Create Firestore database in Native mode

4. Authenticate:
```bash
gcloud auth application-default login
```

5. Configure `.env`:
```
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
STORAGE_BACKEND=gcs
DB_BACKEND=firestore
TEST_MODE=false
```

6. Run backend + frontend as above (without TEST_MODE)

---

## Docker Compose (Both Services)

```bash
# Add your service account key as gcp-credentials.json in the root
docker-compose up --build
```
Frontend: http://localhost:3000
Backend API: http://localhost:8000/docs

---

## Cloud Run Deployment

```bash
export GCP_PROJECT_ID=your-project-id
chmod +x deploy-cloud-run.sh
./deploy-cloud-run.sh
```

---

## Architecture

```
Frontend (React + Vite + Tailwind)
    │
    ├── Step 1: Product Upload → POST /api/generate/prompts
    │           └─ Gemini 2.5 Pro (structured JSON, zero hallucination)
    │
    ├── Step 2: Style + Theme + Prompt selection
    │
    ├── Step 3: Character (preset / camera / upload)
    │
    ├── Step 4: Audio (preset / record / upload)
    │
    └── Step 5: Review → POST /api/generate/video
                └─ Veo 3 (video generation)
                └─ GCS (asset + video storage)
                └─ Firestore (request tracking)
                └─ QR Code → /video/:requestId page
```

## GCP Services Used

| Service | Purpose |
|---|---|
| Vertex AI Veo 3 | Video generation |
| Gemini 2.5 Pro | Prompt analysis (structured output) |
| Gemini 2.0 Flash | Fast image understanding |
| Cloud Storage (GCS) | Asset + video storage |
| Cloud Firestore | Request tracking & status |
| Cloud Run | Backend + frontend hosting |
| Container Registry | Docker image storage |
