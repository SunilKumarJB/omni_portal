#!/bin/bash
# Deploy Omni Video Generator to Google Cloud Run
set -e

# ---- CONFIGURE THESE (override by exporting the env var before running) ----
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_LOCATION:-us-central1}"
BACKEND_SERVICE="${BACKEND_SERVICE:-omni-video-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-omni-video-frontend}"
REPO="gcr.io/${PROJECT_ID}"

# Runtime config — single source of truth for the backend's pydantic Settings.
# Each falls back to a sensible default; change a model/bucket here (or export it)
# and redeploy — no code edit required.
GCS_BUCKET="${GCS_BUCKET_NAME:-your-gcs-bucket-name}"
GEMINI_MODEL="${GEMINI_MODEL:-gemini-omni-1.1-flash-preview}"
REGION="${REGION:-global}"                       # model interactions region
# --------------------------

echo "🚀 Deploying Omni Video Generator to Cloud Run (project: ${PROJECT_ID})"

gcloud config set project "${PROJECT_ID}"
gcloud auth configure-docker

# Build & push backend
echo "📦 Building backend..."
docker build -t "${REPO}/${BACKEND_SERVICE}:latest" ./backend
docker push "${REPO}/${BACKEND_SERVICE}:latest"

# Deploy backend to Cloud Run.
# Video generation runs 3-8 min in a FastAPI BackgroundTask AFTER the HTTP response
# returns. --no-cpu-throttling keeps the CPU allocated so that task keeps running, and
# --min-instances 1 keeps a warm instance so it isn't reaped during scale-in (otherwise
# requests get stuck at "processing" forever). A fully robust design would move generation
# to a Cloud Tasks / Pub/Sub worker decoupled from the request lifecycle.
echo "☁️  Deploying backend..."
gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${REPO}/${BACKEND_SERVICE}:latest" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --concurrency 80 \
  --no-cpu-throttling \
  --min-instances 1 \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GCS_BUCKET_NAME=${GCS_BUCKET},GEMINI_MODEL=${GEMINI_MODEL},REGION=${REGION},STORAGE_BACKEND=gcs,DB_BACKEND=firestore,TEST_MODE=false"
# FRONTEND_URL + ALLOWED_ORIGINS are set further down, once the frontend URL is known.

BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
  --platform managed --region "${REGION}" \
  --format 'value(status.url)')

echo "✅ Backend deployed at: ${BACKEND_URL}"

# Update frontend to point to backend
echo "📦 Building frontend..."
docker build \
  --build-arg VITE_API_URL="${BACKEND_URL}" \
  -t "${REPO}/${FRONTEND_SERVICE}:latest" \
  ./frontend
docker push "${REPO}/${FRONTEND_SERVICE}:latest"

echo "☁️  Deploying frontend..."
gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${REPO}/${FRONTEND_SERVICE}:latest" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 80 \
  --memory 512Mi \
  --cpu 1

FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
  --platform managed --region "${REGION}" \
  --format 'value(status.url)')

# Now that the frontend URL exists, point the backend at it. FRONTEND_URL drives the
# QR-code / share links (qr_service) — without this they'd default to localhost and
# every QR code would be dead. ALLOWED_ORIGINS opens CORS to the deployed frontend.
echo "🔗 Wiring backend → frontend (QR/share links + CORS)..."
gcloud run services update "${BACKEND_SERVICE}" \
  --platform managed --region "${REGION}" \
  --update-env-vars "FRONTEND_URL=${FRONTEND_URL},ALLOWED_ORIGINS=${FRONTEND_URL}"

echo ""
echo "✅ Deployment complete!"
echo "   Frontend: ${FRONTEND_URL}"
echo "   Backend:  ${BACKEND_URL}"
echo "   API docs: ${BACKEND_URL}/docs"
echo ""
echo "⚠️  Still verify manually:"
echo "   1. GCS bucket '${GCS_BUCKET}' exists and the runtime SA can write to it"
echo "   2. Firestore database is initialized in project '${PROJECT_ID}'"
