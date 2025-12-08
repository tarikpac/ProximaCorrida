#!/usr/bin/env pwsh
# Lambda Build Script - Creates minimal deployment package

$ErrorActionPreference = "Stop"

Write-Host "🧹 Step 1: Cleaning previous builds..." -ForegroundColor Cyan
if (Test-Path ".serverless") { Remove-Item -Recurse -Force ".serverless" }
if (Test-Path "lambda-build") { Remove-Item -Recurse -Force "lambda-build" }

Write-Host "🏗️ Step 2: Building TypeScript..." -ForegroundColor Cyan
npm run build

Write-Host "📁 Step 3: Creating lambda-build directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "lambda-build" -Force | Out-Null

Write-Host "📦 Step 4: Copying dist files..." -ForegroundColor Cyan
Copy-Item -Recurse "dist" "lambda-build/dist"

Write-Host "📦 Step 5: Copying package.json..." -ForegroundColor Cyan
Copy-Item "package.json" "lambda-build/"
Copy-Item "package-lock.json" "lambda-build/" -ErrorAction SilentlyContinue

Write-Host "📦 Step 6: Copying prisma schema..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "lambda-build/prisma" -Force | Out-Null
Copy-Item "prisma/schema.prisma" "lambda-build/prisma/"

Write-Host "📦 Step 7: Installing production dependencies in lambda-build..." -ForegroundColor Cyan
Push-Location "lambda-build"
npm install --omit=dev --ignore-scripts
Pop-Location

Write-Host "🔧 Step 8: Generating Prisma Client in lambda-build..." -ForegroundColor Cyan
Push-Location "lambda-build"
npx prisma generate
Pop-Location

Write-Host "📊 Step 9: Checking package size..." -ForegroundColor Cyan
$size = (Get-ChildItem -Recurse "lambda-build" | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Total size: $([math]::Round($size, 2)) MB" -ForegroundColor Yellow

if ($size -gt 250) {
    Write-Host "⚠️ WARNING: Package is larger than 250MB Lambda limit!" -ForegroundColor Red
} else {
    Write-Host "✅ Package size is within Lambda limits" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Build complete! Package is in ./lambda-build" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy, copy serverless.yml to lambda-build and run:" -ForegroundColor White
Write-Host "  cd lambda-build && npx sls deploy --stage prod" -ForegroundColor Cyan
