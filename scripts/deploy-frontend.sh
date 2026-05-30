#!/bin/bash

# =============================================================================
# COSMFOLIO - AUTOMATED FRONTEND DEPLOYMENT TO VERCEL
# =============================================================================
# This script automates deployment of the React frontend to Vercel
# Usage: bash deploy-frontend.sh
# =============================================================================

set -e

echo "=================================================="
echo "  COSMFOLIO - FRONTEND DEPLOYMENT (Vercel)"
echo "=================================================="

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get backend URL
read -p "Enter your Railway backend URL (e.g., https://cosmfolio-xyz.up.railway.app): " BACKEND_URL

# Validate URL
if [[ ! $BACKEND_URL =~ ^https?:// ]]; then
    echo -e "${RED}Invalid URL. Must start with http:// or https://${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
echo -e "${BLUE}[1/5]${NC} Checking Vercel CLI installation..."
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if git is initialized
echo -e "${BLUE}[2/5]${NC} Checking git repository..."
if [ ! -d .git ]; then
    echo -e "${RED}Git repository not found. Run deploy-backend.sh first.${NC}"
    exit 1
fi

# Create/update .env.local for frontend
echo -e "${BLUE}[3/5]${NC} Configuring environment variables..."
cat > frontend/.env.local << EOF
VITE_API_URL=$BACKEND_URL
VITE_APP_URL=https://cosmfolio.vercel.app
EOF

echo "Created frontend/.env.local with:"
echo "  VITE_API_URL=$BACKEND_URL"

# Push changes to GitHub
echo -e "${BLUE}[4/5]${NC} Pushing configuration to GitHub..."
git add frontend/.env.local 2>/dev/null || true
git commit -m "Update frontend API configuration" || true
git push origin main 2>/dev/null || git push origin main

# Deploy to Vercel
echo -e "${BLUE}[5/5]${NC} Deploying to Vercel..."
cd frontend
vercel --prod

echo ""
echo -e "${GREEN}=================================================="
echo "  DEPLOYMENT COMPLETE!"
echo "==================================================${NC}"
echo ""
echo "Your frontend is now live!"
echo ""
echo -e "${BLUE}Frontend URL:${NC} https://cosmfolio.vercel.app"
echo -e "${BLUE}Backend URL:${NC} $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Open https://cosmfolio.vercel.app in your browser"
echo "2. Test the application"
echo "3. Create a test account and upload images"
echo "4. Generate presentations and export PDFs"
echo ""
