#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-echomori-app}"
REGION="${REGION:-europe-west1}"
ARTIFACT_REPO="${ARTIFACT_REPO:-echomori}"
DEPLOY_SA_NAME="${DEPLOY_SA_NAME:-github-deploy}"
RUN_SA_NAME="${RUN_SA_NAME:-echomori-run}"
BUCKET_STAGING="${BUCKET_STAGING:-echomori-drive-bucket-staging}"
BUCKET_PROD="${BUCKET_PROD:-echomori-drive-bucket-prod}"
KEY_OUT="${KEY_OUT:-./github-deploy-key.json}"

DEPLOY_SA="${DEPLOY_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
RUN_SA="${RUN_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  storage.googleapis.com

if ! gcloud artifacts repositories describe "$ARTIFACT_REPO" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$ARTIFACT_REPO" \
    --repository-format=docker \
    --location="$REGION"
fi

if ! gcloud iam service-accounts describe "$DEPLOY_SA" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$DEPLOY_SA_NAME" \
    --display-name="GitHub Actions Cloud Run deploy"
fi

if ! gcloud iam service-accounts describe "$RUN_SA" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$RUN_SA_NAME" \
    --display-name="Cloud Run runtime for Echomori"
fi

for ROLE in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOY_SA}" \
    --role="$ROLE" \
    --quiet >/dev/null
done

gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

gcloud iam service-accounts add-iam-policy-binding "$RUN_SA" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --quiet >/dev/null

for BUCKET in "$BUCKET_STAGING" "$BUCKET_PROD"; do
  if gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1; then
    gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
      --member="serviceAccount:${RUN_SA}" \
      --role="roles/storage.objectAdmin" \
      --quiet >/dev/null
  fi
done

if [ ! -f "$KEY_OUT" ]; then
  gcloud iam service-accounts keys create "$KEY_OUT" --iam-account="$DEPLOY_SA"
fi

cat <<EOF

Bootstrap complete.

Add this JSON as GitHub secret GCP_SA_KEY (environments production and staging):
  ${KEY_OUT}

Set GitHub environment variable GCP_RUN_SA to:
  ${RUN_SA}

Then create GitHub Environments "production" and "Staging" with the vars/secrets
listed in .github/workflows/deploy-cloud-run.yml.

Map a domain after the first deploy:
  gcloud run domain-mappings create --service=echomori --domain=echomori.fr --region=${REGION}

Do not commit ${KEY_OUT}.
EOF
