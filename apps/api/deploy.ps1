#!/usr/bin/env pwsh
# Lambda Deployment Script
# Builds a clean production package and deploys to AWS Lambda

$ErrorActionPreference = "Stop"

Write-Host "🚀 ProximaCorrida API - Lambda Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Clean
Write-Host "`n📦 Step 1/6: Cleaning previous build..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .serverless -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Step 2: Install production dependencies only
Write-Host "`n📦 Step 2/6: Installing production dependencies..." -ForegroundColor Yellow
npm install --omit=dev --legacy-peer-deps

# Step 3: Generate Prisma Client
Write-Host "`n🔧 Step 3/6: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Step 4: Remove Windows binary (not needed in Lambda)
Write-Host "`n🧹 Step 4/6: Removing Windows Prisma binary..." -ForegroundColor Yellow
$windowsBinary = "node_modules/.prisma/client/query_engine-windows.dll.node"
if (Test-Path $windowsBinary) {
    Remove-Item $windowsBinary -Force
    Write-Host "   Removed Windows binary" -ForegroundColor Green
}

# Step 5: Check size
Write-Host "`n📊 Step 5/6: Checking package size..." -ForegroundColor Yellow
$size = (Get-ChildItem -Path "node_modules" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   node_modules size: $([math]::Round($size, 2)) MB"
if ($size -gt 200) {
    Write-Host "   ⚠️  WARNING: Size is getting close to Lambda limit (250MB)" -ForegroundColor Red
}

# Step 6: Build TypeScript
Write-Host "`n🏗️ Step 6/6: Building TypeScript..." -ForegroundColor Yellow
# Need to install nest CLI temporarily for build
npm install --save-dev @nestjs/cli typescript --legacy-peer-deps
npx nest build

# Deploy
Write-Host "`n🚀 Deploying to AWS Lambda..." -ForegroundColor Cyan
npm install --save-dev serverless@3 --legacy-peer-deps
npx serverless deploy --stage prod

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
