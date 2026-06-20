param (
    [string]$AppUrl      = "https://cosmofolio-beryl.vercel.app",
    [string]$DemoEmail   = $env:DEMO_EMAIL,
    [string]$DemoPassword = $env:DEMO_PASSWORD,
    [switch]$CarouselsOnly,
    [switch]$ReelsOnly,
    [switch]$SkipRecord
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  CosmoFolio Content Pipeline" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── Credential check ─────────────────────────────────────────────────────────
if (-not $CarouselsOnly -and -not $SkipRecord) {
    if (-not $DemoEmail) {
        $DemoEmail = Read-Host "Enter your CosmoFolio demo account email"
    }
    if (-not $DemoPassword) {
        $secPass = Read-Host "Enter password" -AsSecureString
        $DemoPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
        )
    }
    $env:DEMO_EMAIL    = $DemoEmail
    $env:DEMO_PASSWORD = $DemoPassword
}
$env:APP_URL = $AppUrl

# ── Dependencies ──────────────────────────────────────────────────────────────
Write-Host "[0] Installing Node dependencies..." -ForegroundColor Yellow
cmd.exe /c "npm install" 2>&1 | Where-Object { $_ -notmatch "^npm warn" }

# Install Playwright browsers if not already present
$playwrightInstalled = node -e "require('playwright')" 2>$null; $?
if (-not (Test-Path "$ScriptDir\node_modules\playwright")) {
    Write-Host "     Installing Playwright browsers (first-time, ~200MB)..." -ForegroundColor Yellow
    cmd.exe /c "npx playwright install chromium" 2>&1
}

Write-Host ""

# ── Step 1: Record browser session ───────────────────────────────────────────
if (-not $CarouselsOnly -and -not $ReelsOnly -and -not $SkipRecord) {
    Write-Host "[1/3] Recording browser session..." -ForegroundColor Green
    Write-Host "      App URL : $AppUrl" -ForegroundColor DarkGray
    Write-Host "      Account : $DemoEmail" -ForegroundColor DarkGray
    Write-Host ""
    node 1_record_session.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Step 1 failed — check errors above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/3] Skipping browser recording (flag set)." -ForegroundColor DarkGray
}

Write-Host ""

# ── Step 2: Generate carousel slides ─────────────────────────────────────────
if (-not $ReelsOnly) {
    Write-Host "[2/3] Generating carousel slides..." -ForegroundColor Green
    node 2_generate_carousels.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Step 2 failed — check errors above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[2/3] Skipping carousels (--ReelsOnly)." -ForegroundColor DarkGray
}

Write-Host ""

# ── Step 3: Assemble reels ────────────────────────────────────────────────────
if (-not $CarouselsOnly) {
    Write-Host "[3/3] Assembling reels (ffmpeg)..." -ForegroundColor Green
    node 3_assemble_reels.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Step 3 failed — check errors above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[3/3] Skipping reels (--CarouselsOnly)." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Pipeline complete!  Output → ../../output" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Print summary of output files
$outputDir = Resolve-Path "$ScriptDir\..\..\output"
Write-Host "Output files:" -ForegroundColor Yellow
Get-ChildItem $outputDir -Recurse -File |
    Where-Object { $_.Extension -match '\.(png|mp4|webm)$' } |
    ForEach-Object {
        $size = if ($_.Length -gt 1MB) { "{0:N1} MB" -f ($_.Length / 1MB) }
                else { "{0:N0} KB" -f ($_.Length / 1KB) }
        Write-Host ("  {0,-45} {1,8}" -f $_.FullName.Replace($outputDir, '').TrimStart('\'), $size)
    }
Write-Host ""
