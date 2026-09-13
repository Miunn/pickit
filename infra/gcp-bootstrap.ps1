$ErrorActionPreference = "Continue"

$GcloudCmd = Get-Command gcloud.cmd -ErrorAction SilentlyContinue
if (-not $GcloudCmd) {
    $GcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
}
if (-not $GcloudCmd) {
    throw "gcloud is not on PATH. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
}

$ProjectId = if ($env:PROJECT_ID) { $env:PROJECT_ID } else { "echomori-app" }
$Region = if ($env:REGION) { $env:REGION } else { "europe-west1" }
$ArtifactRepo = if ($env:ARTIFACT_REPO) { $env:ARTIFACT_REPO } else { "echomori" }
$DeploySaName = if ($env:DEPLOY_SA_NAME) { $env:DEPLOY_SA_NAME } else { "github-deploy" }
$RunSaName = if ($env:RUN_SA_NAME) { $env:RUN_SA_NAME } else { "echomori-run" }
$BucketDefault = if ($env:BUCKET_DEFAULT) { $env:BUCKET_DEFAULT } else { "echomori-drive-bucket" }
$BucketStaging = if ($env:BUCKET_STAGING) { $env:BUCKET_STAGING } else { "echomori-drive-bucket-staging" }
$BucketProd = if ($env:BUCKET_PROD) { $env:BUCKET_PROD } else { "echomori-drive-bucket-prod" }
$KeyOut = if ($env:KEY_OUT) { $env:KEY_OUT } else { Join-Path (Get-Location) "github-deploy-key.json" }

$DeploySa = "$DeploySaName@$ProjectId.iam.gserviceaccount.com"
$RunSa = "$RunSaName@$ProjectId.iam.gserviceaccount.com"

function Invoke-Gcloud {
    param(
        [Parameter(Mandatory = $true)][string[]]$Args,
        [switch]$AllowFail
    )

    $output = & $GcloudCmd.Source @Args 2>&1
    $code = $LASTEXITCODE
    if ($code -ne 0 -and -not $AllowFail) {
        $text = ($output | Out-String).Trim()
        throw "gcloud $($Args -join ' ') failed:`n$text"
    }
    return $code
}

Write-Host "Using project $ProjectId in $Region"
Invoke-Gcloud -Args @("config", "set", "project", $ProjectId)

Write-Host "Enabling APIs..."
Invoke-Gcloud -Args @(
    "services", "enable",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "storage.googleapis.com"
)

Write-Host "Checking Artifact Registry repo $ArtifactRepo..."
$repoExists = (Invoke-Gcloud -AllowFail -Args @(
    "artifacts", "repositories", "describe", $ArtifactRepo, "--location=$Region"
)) -eq 0
if (-not $repoExists) {
    Write-Host "Creating Artifact Registry repo $ArtifactRepo..."
    Invoke-Gcloud -Args @(
        "artifacts", "repositories", "create", $ArtifactRepo,
        "--repository-format=docker",
        "--location=$Region"
    )
}

Write-Host "Checking deploy service account..."
$deployExists = (Invoke-Gcloud -AllowFail -Args @("iam", "service-accounts", "describe", $DeploySa)) -eq 0
if (-not $deployExists) {
    Write-Host "Creating $DeploySa..."
    Invoke-Gcloud -Args @(
        "iam", "service-accounts", "create", $DeploySaName,
        "--display-name=GitHub Actions Cloud Run deploy"
    )
}

Write-Host "Checking runtime service account..."
$runExists = (Invoke-Gcloud -AllowFail -Args @("iam", "service-accounts", "describe", $RunSa)) -eq 0
if (-not $runExists) {
    Write-Host "Creating $RunSa..."
    Invoke-Gcloud -Args @(
        "iam", "service-accounts", "create", $RunSaName,
        "--display-name=Cloud Run runtime for Echomori"
    )
}

Write-Host "Granting deploy roles..."
foreach ($Role in @("roles/run.admin", "roles/artifactregistry.writer", "roles/iam.serviceAccountUser")) {
    Invoke-Gcloud -Args @(
        "projects", "add-iam-policy-binding", $ProjectId,
        "--member=serviceAccount:$DeploySa",
        "--role=$Role",
        "--quiet"
    ) | Out-Null
}

Invoke-Gcloud -Args @(
    "iam", "service-accounts", "add-iam-policy-binding", $RunSa,
    "--member=serviceAccount:$DeploySa",
    "--role=roles/iam.serviceAccountUser",
    "--quiet"
) | Out-Null

Invoke-Gcloud -Args @(
    "iam", "service-accounts", "add-iam-policy-binding", $RunSa,
    "--member=serviceAccount:$RunSa",
    "--role=roles/iam.serviceAccountTokenCreator",
    "--quiet"
) | Out-Null

foreach ($Bucket in @($BucketDefault, $BucketStaging, $BucketProd)) {
    $bucketExists = (Invoke-Gcloud -AllowFail -Args @("storage", "buckets", "describe", "gs://$Bucket")) -eq 0
    if ($bucketExists) {
        Write-Host "Granting objectAdmin on gs://$Bucket..."
        Invoke-Gcloud -Args @(
            "storage", "buckets", "add-iam-policy-binding", "gs://$Bucket",
            "--member=serviceAccount:$RunSa",
            "--role=roles/storage.objectAdmin",
            "--quiet"
        ) | Out-Null
    }
    else {
        Write-Host "Skipping missing bucket gs://$Bucket"
    }
}

if (-not (Test-Path $KeyOut)) {
    Write-Host "Creating deploy key $KeyOut..."
    Invoke-Gcloud -Args @("iam", "service-accounts", "keys", "create", $KeyOut, "--iam-account=$DeploySa")
}
else {
    Write-Host "Deploy key already exists: $KeyOut"
}

Write-Host ""
Write-Host "Bootstrap complete."
Write-Host ""
Write-Host "Add this JSON as GitHub secret GCP_SA_KEY (environments production and staging):"
Write-Host "  $KeyOut"
Write-Host ""
Write-Host "Set GitHub environment variable GCP_RUN_SA to:"
Write-Host "  $RunSa"
Write-Host ""
Write-Host "Then create GitHub Environments production and Staging with the vars/secrets"
Write-Host "listed in .github/workflows/deploy-cloud-run.yml."
Write-Host ""
Write-Host "Map a domain after the first deploy:"
Write-Host "  gcloud run domain-mappings create --service=echomori --domain=echomori.fr --region=$Region"
Write-Host ""
Write-Host "Do not commit $KeyOut."
