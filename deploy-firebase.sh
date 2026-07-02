#!/bin/bash
# Deploy Frontend to Firebase Hosting for Mobile QR Code Sharing
set -e

PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"

if [ "${PROJECT_ID}" = "your-gcp-project-id" ]; then
  echo "⚠️  Error: Please set GCP_PROJECT_ID before deploying."
  echo "   Example: export GCP_PROJECT_ID=\"my-actual-project-id\" && ./deploy-firebase.sh"
  exit 1
fi

echo "🚀 Building frontend production bundle..."
cd frontend
npm run build
cd ..

echo "🔥 Deploying to Firebase Hosting (project: ${PROJECT_ID})..."
npx firebase-tools deploy --only hosting --project "${PROJECT_ID}"

FIREBASE_URL="https://${PROJECT_ID}.web.app"

echo ""
echo "✅ Firebase Hosting deployment complete!"
echo "   Live Frontend URL: ${FIREBASE_URL}"
echo ""
echo "📱 To enable mobile QR code scanning for generated videos:"
echo "   1. Update backend/.env:"
echo "      FRONTEND_URL=${FIREBASE_URL}"
echo "   2. Restart your backend server:"
echo "      make start-be"
