#!/bin/bash
# Deploy Omni Video Generator to Google Cloud Run
set -e

# ---- CONFIGURE THESE ----
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_LOCATION:-us-central1}"
BACKEND_SERVICE="omni-video-backend"
FRONTEND_SERVICE="omni-video-frontend"
REPO="gcr.io/${PROJECT_ID}"
# --------------------------

echo "🚀 Deploying Omni Video Generator to Cloud Run (project: ${PROJECT_ID})"

gcloud config set project "${PROJECT_ID}"
gcloud auth configure-docker

# Build & push backend
echo "📦 Building backend..."
docker build -t "${REPO}/${BACKEND_SERVICE}:latest" ./backend
docker push "${REPO}/${BACKEND_SERVICE}:latest"

# Deploy backend to Cloud Run
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
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},STORAGE_BACKEND=gcs,DB_BACKEND=firestore,TEST_MODE=false"

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

echo ""
echo "✅ Deployment complete!"
echo "   Frontend: ${FRONTEND_URL}"
echo "   Backend:  ${BACKEND_URL}"
echo "   API docs: ${BACKEND_URL}/docs"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Set FRONTEND_URL env var on backend: ${FRONTEND_URL}"
echo "   2. Add CORS origin to ALLOWED_ORIGINS"
echo "   3. Ensure GCS bucket '$(grep GCS_BUCKET_NAME backend/.env | cut -d= -f2)' exists"
echo "   4. Firestore database initialized in project"
