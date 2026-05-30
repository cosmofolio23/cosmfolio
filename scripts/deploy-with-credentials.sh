#!/bin/bash

# =============================================================================
# COSMFOLIO - DEPLOYMENT WITH CREDENTIALS
# =============================================================================
# Usage:
# 1. Copy and fill .credentials.template → .credentials
# 2. Run: bash scripts/deploy-with-credentials.sh
# =============================================================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     COSMFOLIO - DEPLOYMENT WITH CREDENTIALS            ║"
echo "║           (Railway + Vercel + Supabase)                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check credentials file
if [ ! -f scripts/.credentials ]; then
    echo -e "${RED}ERROR: Credentials file not found!${NC}"
    echo ""
    echo "Steps:"
    echo "1. Copy template: cp scripts/.credentials.template scripts/.credentials"
    echo "2. Edit file: nano scripts/.credentials"
    echo "3. Fill in your real credentials"
    echo "4. Run this script again"
    exit 1
fi

# Load credentials
source scripts/.credentials

# Validate credentials
echo -e "${CYAN}Validating credentials...${NC}"
echo "=================================="

if [ -z "$GITHUB_USERNAME" ] || [ "$GITHUB_USERNAME" = "your_github_username_here" ]; then
    echo -e "${RED}✗ GITHUB_USERNAME not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} GitHub username: $GITHUB_USERNAME"

if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "your_supabase_url_here" ]; then
    echo -e "${RED}✗ SUPABASE_URL not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Supabase URL: ${SUPABASE_URL:0:30}..."

if [ -z "$SUPABASE_ANON_KEY" ] || [ "$SUPABASE_ANON_KEY" = "your_anon_key_here" ]; then
    echo -e "${RED}✗ SUPABASE_ANON_KEY not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Supabase anon key: configured"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_service_role_key_here" ]; then
    echo -e "${RED}✗ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Supabase service role key: configured"

if [ -n "$REPLICATE_API_TOKEN" ] && [ "$REPLICATE_API_TOKEN" != "your_replicate_token_here" ]; then
    echo -e "${GREEN}✓${NC} Replicate API token: configured"
else
    echo -e "${YELLOW}⚠${NC} Replicate API token: not set (will use mock mode)"
fi

echo ""
echo -e "${CYAN}Step 1: Setting up Git Repository${NC}"
echo "=================================="

# Initialize git if needed
if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "Initial commit - CosmoFolio"
    echo -e "${GREEN}✓${NC} Git repository initialized"
else
    echo -e "${GREEN}✓${NC} Git repository already initialized"
fi

# Add remote
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git"
if ! git remote | grep -q origin; then
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✓${NC} GitHub remote added: $GITHUB_URL"
else
    echo -e "${GREEN}✓${NC} GitHub remote already configured"
fi

# Push to GitHub
echo "Pushing code to GitHub..."
git add .
git commit -m "Pre-deployment: CosmoFolio all 8 phases ready" || true
git push -u origin main 2>/dev/null || git push origin main
echo -e "${GREEN}✓${NC} Code pushed to GitHub"

echo ""
echo -e "${CYAN}Step 2: Creating Production Environment${NC}"
echo "=================================="

# Create production .env for backend
cat > backend/.env.production << EOF
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
SECRET_KEY=${SECRET_KEY:-$(openssl rand -hex 32)}
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
REPLICATE_API_TOKEN=$REPLICATE_API_TOKEN
SECURE_COOKIES=true
CSRF_ENABLED=true
RATE_LIMIT_ENABLED=true
EOF

echo -e "${GREEN}✓${NC} Backend .env.production created"

# Create production .env for frontend
cat > frontend/.env.production << EOF
VITE_API_URL=https://cosmfolio-production.up.railway.app
VITE_APP_URL=https://cosmfolio.vercel.app
EOF

echo -e "${GREEN}✓${NC} Frontend .env.production created"

echo ""
echo -e "${CYAN}Step 3: Preparing Deployment Tools${NC}"
echo "=================================="

# Check/install Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi
echo -e "${GREEN}✓${NC} Railway CLI ready"

# Check/install Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi
echo -e "${GREEN}✓${NC} Vercel CLI ready"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                READY FOR DEPLOYMENT!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}Manual Steps Required (Interactive):${NC}"
echo ""
echo "1. Deploy Backend to Railway:"
echo "   - Run: railway login"
echo "   - Run: railway up"
echo ""
echo "2. Deploy Frontend to Vercel:"
echo "   - Run: vercel auth login"
echo "   - Run: cd frontend && vercel --prod"
echo ""
echo "3. After both complete, you'll have:"
echo "   - Backend: https://cosmfolio-xxxx.up.railway.app"
echo "   - Frontend: https://cosmfolio.vercel.app"
echo ""
echo -e "${CYAN}Or run the individual scripts:${NC}"
echo "  bash scripts/deploy-backend.sh"
echo "  bash scripts/deploy-frontend.sh"
echo ""
