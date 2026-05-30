#!/bin/bash

# =============================================================================
# COSMFOLIO - AUTOMATED BACKEND DEPLOYMENT TO RAILWAY
# =============================================================================
# This script automates deployment of the FastAPI backend to Railway.app
# Usage: bash deploy-backend.sh
# =============================================================================

set -e

echo "=================================================="
echo "  COSMFOLIO - BACKEND DEPLOYMENT (Railway)"
echo "=================================================="

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Railway CLI is installed
echo -e "${BLUE}[1/6]${NC} Checking Railway CLI installation..."
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if git is initialized
echo -e "${BLUE}[2/6]${NC} Checking git repository..."
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit - CosmoFolio"
fi

# Check if GitHub remote exists
echo -e "${BLUE}[3/6]${NC} Checking GitHub remote..."
if ! git remote | grep -q origin; then
    echo -e "${YELLOW}GitHub remote not found${NC}"
    echo "Please create a GitHub repository and add it as remote:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/cosmfolio.git"
    exit 1
fi

# Push to GitHub
echo -e "${BLUE}[4/6]${NC} Pushing code to GitHub..."
git add .
git commit -m "Pre-deployment commit - CosmoFolio" || true
git push -u origin main 2>/dev/null || git push origin main

# Login to Railway
echo -e "${BLUE}[5/6]${NC} Logging in to Railway..."
railway login

# Create and deploy to Railway
echo -e "${BLUE}[6/6]${NC} Deploying to Railway..."
railway up

echo ""
echo -e "${GREEN}=================================================="
echo "  DEPLOYMENT COMPLETE!"
echo "==================================================${NC}"
echo ""
echo "Your backend is now live!"
echo ""
echo -e "${BLUE}Backend URL:${NC} $(railway domain)"
echo -e "${BLUE}Swagger Docs:${NC} $(railway domain)/docs"
echo -e "${BLUE}Health Check:${NC} $(railway domain)/health"
echo ""
echo "Next steps:"
echo "1. Note your backend URL above"
echo "2. Update frontend VITE_API_URL environment variable"
echo "3. Deploy frontend with: bash deploy-frontend.sh"
echo ""
