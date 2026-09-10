#!/bin/bash
# Deploy Omni Video Generator to Google Cloud Run using Google Cloud Build
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# -----------------------------------------------------------------------------
# 1. Load configuration from gitignored files (precedence: CLI env > .env.deploy > .env > backend/.env)
# -----------------------------------------------------------------------------
load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    echo "📄 Loading configuration from ${file}..."
    while IFS= read -r line || [ -n "$line" ]; do
      line="${line#"${line%%[![:space:]]*}"}" # strip leading spaces
      [[ "$line" =~ ^#.*$ ]] && continue      # skip comments
      [ -z "$line" ] && continue              # skip empty lines
      key="${line%%=*}"
      val="${line#*=}"
      val="${val%\"}"                         # strip quotes
      val="${val#\"}"
      val="${val%\'}"
      val="${val#\'}"
      if [ -z "${!key+x}" ]; then            # only set if not already set in environment
        export "${key}=${val}"
      fi
    done < "$file"
  fi
}

if [ -f "${SCRIPT_DIR}/.env.deploy" ]; then
  load_env_file "${SCRIPT_DIR}/.env.deploy"
elif [ -f "${SCRIPT_DIR}/.env" ]; then
  load_env_file "${SCRIPT_DIR}/.env"
elif [ -f "${SCRIPT_DIR}/backend/.env" ]; then
  load_env_file "${SCRIPT_DIR}/backend/.env"
fi

# -----------------------------------------------------------------------------
# 2. Variable resolution & interactive prompt helpers
# -----------------------------------------------------------------------------
prompt_var() {
  local var_name="$1"
  local prompt_text="$2"
  local default_val="$3"
  local current_val="${!var_name}"

  if [ -z "${current_val}" ] || [ "${current_val}" = "your-project-id" ] || [ "${current_val}" = "your-gcs-bucket-name" ]; then
    if [ -t 0 ]; then
      read -r -p "${prompt_text} [${default_val}]: " input_val
      eval "${var_name}=\"\${input_val:-$default_val}\""
    else
      eval "${var_name}=\"${default_val}\""
    fi
  fi
}

DETECTED_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
DETECTED_REGION=$(gcloud config get-value compute/region 2>/dev/null || echo "")
# Fallback to India (asia-south1) if no region configured
FALLBACK_REGION="${DETECTED_REGION:-asia-south1}"

PROJECT_ID="${GCP_PROJECT_ID:-}"
prompt_var "PROJECT_ID" "GCP Project ID" "${DETECTED_PROJECT}"
if [ -z "${PROJECT_ID}" ] || [ "${PROJECT_ID}" = "your-project-id" ]; then
  echo "❌ Error: Project ID is required. Set GCP_PROJECT_ID or run 'gcloud config set project <id>'."
  exit 1
fi

REGION="${GCP_LOCATION:-}"
prompt_var "REGION" "Cloud Run Region (fallback India: asia-south1)" "${FALLBACK_REGION}"
if [ -z "${REGION}" ]; then
  REGION="asia-south1"
fi

GCS_BUCKET="${GCS_BUCKET_NAME:-}"
DEFAULT_BUCKET="${PROJECT_ID}-omni-videos"
prompt_var "GCS_BUCKET" "GCS Bucket for videos" "${DEFAULT_BUCKET}"

FIRESTORE_DB="${FIRESTORE_DATABASE_ID:-}"
prompt_var "FIRESTORE_DB" "Firestore Database ID (blank for default)" ""

SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-}"
DEFAULT_SA="omni-portal-sa@${PROJECT_ID}.iam.gserviceaccount.com"
prompt_var "SERVICE_ACCOUNT" "Cloud Run Service Account" "${DEFAULT_SA}"

BACKEND_SERVICE="${BACKEND_SERVICE:-omni-video-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-omni-video-frontend}"
AR_REPO="${AR_REPO:-cloud-run-source-deploy}"
REPO="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"

GEMINI_MODEL="${GEMINI_MODEL:-gemini-omni-1.1-flash-preview}"
# The Gemini Omni Interactions API only supports global, us, and eu.
# Keep global so backend in any region connects over Google's internal backbone.
OMNI_REGION="${OMNI_REGION:-global}"
DEMO_API_KEY="${DEMO_API_KEY:-}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Optional: Prompt to save config to gitignored .env.deploy if it doesn't exist
if [ ! -f "${SCRIPT_DIR}/.env.deploy" ] && [ -t 0 ]; then
  read -r -p "💾 Save these deployment settings to gitignored .env.deploy? [y/N]: " SAVE_CONF
  if [[ "${SAVE_CONF}" =~ ^[Yy]$ ]]; then
    cat <<SAVE_EOF > "${SCRIPT_DIR}/.env.deploy"
GCP_PROJECT_ID=${PROJECT_ID}
GCP_LOCATION=${REGION}
GCS_BUCKET_NAME=${GCS_BUCKET}
FIRESTORE_DATABASE_ID=${FIRESTORE_DB}
SERVICE_ACCOUNT=${SERVICE_ACCOUNT}
GEMINI_MODEL=${GEMINI_MODEL}
OMNI_REGION=${OMNI_REGION}
AR_REPO=${AR_REPO}
BACKEND_SERVICE=${BACKEND_SERVICE}
FRONTEND_SERVICE=${FRONTEND_SERVICE}
DEMO_API_KEY=${DEMO_API_KEY}
LOG_LEVEL=${LOG_LEVEL}
SAVE_EOF
    echo "✅ Saved to .env.deploy"
  fi
fi

# -----------------------------------------------------------------------------
# 3. Infrastructure Auto-Provisioning (GCS Bucket, SA, Roles, Artifact Registry)
# -----------------------------------------------------------------------------
echo "🚀 Deploying Omni Video Generator to Cloud Run"
echo "   Project:         ${PROJECT_ID}"
echo "   Region:          ${REGION}"
echo "   Bucket:          ${GCS_BUCKET}"
echo "   Firestore DB:    ${FIRESTORE_DB:-(default)}"
echo "   Service Account: ${SERVICE_ACCOUNT}"
echo "   Model:           ${GEMINI_MODEL} (${OMNI_REGION})"
echo "   Artifact Repo:   ${REPO}"
echo ""

gcloud config set project "${PROJECT_ID}"

PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)' 2>/dev/null || echo "")

# 3a. Auto-create GCS Bucket if it does not exist
if ! gcloud storage buckets describe "gs://${GCS_BUCKET}" >/dev/null 2>&1; then
  echo "🪣 Bucket 'gs://${GCS_BUCKET}' does not exist. Creating in ${REGION}..."
  gcloud storage buckets create "gs://${GCS_BUCKET}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
fi

# Grant Vertex AI service agent access to the bucket for URI delivery
if [ -n "${PROJECT_NUMBER}" ]; then
  VERTEX_SA="service-${PROJECT_NUMBER}@gcp-sa-aiplatform.iam.gserviceaccount.com"
  gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
    --member="serviceAccount:${VERTEX_SA}" \
    --role="roles/storage.objectAdmin" --quiet >/dev/null 2>&1 || true
fi

# 3b. Auto-create Service Account and grant required roles if not existing
SA_NAME="${SERVICE_ACCOUNT%%@*}"
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "👤 Service account '${SERVICE_ACCOUNT}' does not exist. Creating..."
  gcloud iam service-accounts create "${SA_NAME}" \
    --description="Omni Portal Cloud Run runtime service account" \
    --display-name="Omni Portal Runtime SA" \
    --project="${PROJECT_ID}"

  echo "🔑 Granting project roles to '${SERVICE_ACCOUNT}'..."
  for role in roles/aiplatform.user roles/datastore.user roles/storage.objectAdmin roles/logging.logWriter; do
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="$role" --condition=None --quiet >/dev/null 2>&1 || true
  done

  # Grant Token Creator to itself (for GCS v4 signed URLs)
  gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project="${PROJECT_ID}" --quiet >/dev/null 2>&1 || true
fi

# Ensure runtime SA has objectAdmin and legacyBucketReader on the target bucket
gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin" --quiet >/dev/null 2>&1 || true
gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.legacyBucketReader" --quiet >/dev/null 2>&1 || true

# Grant serviceAccountUser to deploying user & Cloud Build
CURRENT_USER=$(gcloud config get-value account 2>/dev/null || echo "")
if [ -n "${CURRENT_USER}" ]; then
  gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
    --member="user:${CURRENT_USER}" \
    --role="roles/iam.serviceAccountUser" \
    --project="${PROJECT_ID}" --quiet >/dev/null 2>&1 || true
fi
if [ -n "${PROJECT_NUMBER}" ]; then
  gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser" \
    --project="${PROJECT_ID}" --quiet >/dev/null 2>&1 || true
  gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser" \
    --project="${PROJECT_ID}" --quiet >/dev/null 2>&1 || true
fi

# 3c. Ensure Artifact Registry Docker repository exists
if ! gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "📦 Creating Artifact Registry repository '${AR_REPO}' in ${REGION}..."
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="Docker repository for Cloud Run source deployments" \
    --quiet || true
fi

# -----------------------------------------------------------------------------
# 4. Build & Deploy Backend
# -----------------------------------------------------------------------------
echo "📦 Building backend with Cloud Build..."
gcloud builds submit ./backend \
  --tag "${REPO}/${BACKEND_SERVICE}:latest" \
  --project "${PROJECT_ID}"

echo "☁️  Deploying backend..."
gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${REPO}/${BACKEND_SERVICE}:latest" \
  --platform managed \
  --region "${REGION}" \
  --service-account "${SERVICE_ACCOUNT}" \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --concurrency 80 \
  --no-cpu-throttling \
  --min-instances 1 \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GCS_BUCKET_NAME=${GCS_BUCKET},FIRESTORE_DATABASE_ID=${FIRESTORE_DB},GEMINI_MODEL=${GEMINI_MODEL},REGION=${OMNI_REGION},STORAGE_BACKEND=gcs,DB_BACKEND=firestore,TEST_MODE=false,DEMO_API_KEY=${DEMO_API_KEY},LOG_LEVEL=${LOG_LEVEL}"

BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
  --platform managed --region "${REGION}" \
  --format 'value(status.url)')

echo "✅ Backend deployed at: ${BACKEND_URL}"

BACKEND_HOST="${BACKEND_URL#https://}"
BACKEND_HOST="${BACKEND_HOST#http://}"
BACKEND_HOST="${BACKEND_HOST%%/*}"

# -----------------------------------------------------------------------------
# 5. Build & Deploy Frontend
# -----------------------------------------------------------------------------
echo "📦 Building frontend with Cloud Build..."
gcloud builds submit ./frontend \
  --tag "${REPO}/${FRONTEND_SERVICE}:latest" \
  --project "${PROJECT_ID}"

echo "☁️  Deploying frontend..."
gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${REPO}/${FRONTEND_SERVICE}:latest" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "BACKEND_URL=${BACKEND_URL},BACKEND_HOST=${BACKEND_HOST}"

FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
  --platform managed --region "${REGION}" \
  --format 'value(status.url)')

# -----------------------------------------------------------------------------
# 6. Wire Backend CORS & QR Codes
# -----------------------------------------------------------------------------
echo "🔗 Wiring backend → frontend (QR links + CORS)..."
gcloud run services update "${BACKEND_SERVICE}" \
  --platform managed --region "${REGION}" \
  --update-env-vars "FRONTEND_URL=${FRONTEND_URL},ALLOWED_ORIGINS=${FRONTEND_URL}"

echo ""
echo "✅ Deployment complete!"
echo "   Frontend: ${FRONTEND_URL}"
echo "   Backend:  ${BACKEND_URL}"
echo "   API docs: ${BACKEND_URL}/docs"
echo ""
