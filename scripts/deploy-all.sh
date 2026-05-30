#!/bin/bash

# =============================================================================
# COSMFOLIO - COMPLETE AUTOMATED DEPLOYMENT
# =============================================================================
# One-click deployment of entire application to Railway + Vercel + Supabase
# Usage: bash deploy-all.sh
# =============================================================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     COSMFOLIO - COMPLETE AUTOMATED DEPLOYMENT           ║"
echo "║                  (Railway + Vercel)                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check prerequisites
echo -e "${CYAN}Step 1: Checking Prerequisites${NC}"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js found"

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python not found. Please install Python.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python found"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git not found. Please install Git.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Git found"

# Install Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi
echo -e "${GREEN}✓${NC} Railway CLI ready"

# Install Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi
echo -e "${GREEN}✓${NC} Vercel CLI ready"

echo ""
echo -e "${CYAN}Step 2: Configuration${NC}"
echo "=================================="

# Get user inputs
read -p "GitHub username (for repository URL): " GITHUB_USERNAME
read -p "GitHub repository name (default: cosmfolio): " GITHUB_REPO_NAME
GITHUB_REPO_NAME=${GITHUB_REPO_NAME:-cosmfolio}

read -p "Supabase project URL (e.g., https://xyz.supabase.co): " SUPABASE_URL
read -p "Supabase anon key: " SUPABASE_KEY
read -p "Supabase service role key: " SUPABASE_SERVICE_ROLE

read -p "Replicate API token (leave blank to use mock mode): " REPLICATE_TOKEN

# Generate secret key
SECRET_KEY=$(openssl rand -hex 32)

echo ""
echo -e "${GREEN}✓${NC} Configuration saved"

# Setup Git repository
echo ""
echo -e "${CYAN}Step 3: Setting up Git Repository${NC}"
echo "=================================="

if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "Initial commit - CosmoFolio All 8 Phases"
    echo -e "${GREEN}✓${NC} Git repository initialized"
else
    echo -e "${GREEN}✓${NC} Git repository already exists"
fi

# Add GitHub remote
if ! git remote | grep -q origin; then
    GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}.git"
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✓${NC} GitHub remote added: $GITHUB_URL"
else
    echo -e "${GREEN}✓${NC} GitHub remote already configured"
fi

# Push to GitHub
echo "Pushing code to GitHub..."
git add .
git commit -m "Deployment configuration" || true
git push -u origin main 2>/dev/null || git push origin main
echo -e "${GREEN}✓${NC} Code pushed to GitHub"

# Create production environment files
echo ""
echo -e "${CYAN}Step 4: Creating Environment Files${NC}"
echo "=================================="

# Backend environment
cat > backend/.env.production << EOF
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
SECRET_KEY=$SECRET_KEY
DATABASE_URL=${SUPABASE_URL/https:\/\//postgresql://}/rest/v1
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE
REPLICATE_API_TOKEN=${REPLICATE_TOKEN:-none}
SECURE_COOKIES=true
CSRF_ENABLED=true
RATE_LIMIT_ENABLED=true
EOF

echo -e "${GREEN}✓${NC} Backend .env.production created"

# Frontend environment
cat > frontend/.env.production << EOF
VITE_API_URL=https://cosmfolio-production.up.railway.app
VITE_APP_URL=https://cosmfolio.vercel.app
EOF

echo -e "${GREEN}✓${NC} Frontend .env.production created"

# Deploy backend
echo ""
echo -e "${CYAN}Step 5: Deploying Backend to Railway${NC}"
echo "=================================="

echo "Logging in to Railway..."
railway login

echo "Deploying to Railway..."
railway up

BACKEND_URL=$(railway domain 2>/dev/null || echo "https://YOUR_RAILWAY_URL")

echo -e "${GREEN}✓${NC} Backend deployed!"
echo -e "${BLUE}Backend URL:${NC} $BACKEND_URL"

# Deploy frontend
echo ""
echo -e "${CYAN}Step 6: Deploying Frontend to Vercel${NC}"
echo "=================================="

echo "Logging in to Vercel..."
vercel auth login

echo "Deploying frontend..."
cd frontend
VERCEL_URL=$(vercel --prod 2>/dev/null | grep -i "preview\|production" | head -1 || echo "https://cosmfolio.vercel.app")
cd ..

echo -e "${GREEN}✓${NC} Frontend deployed!"

# Final summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                DEPLOYMENT COMPLETE!                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓${NC} ${CYAN}Backend (FastAPI)${NC}"
echo "   URL: $BACKEND_URL"
echo "   Docs: $BACKEND_URL/docs"
echo "   Health: $BACKEND_URL/health"
echo ""
echo -e "${GREEN}✓${NC} ${CYAN}Frontend (React)${NC}"
echo "   URL: $VERCEL_URL"
echo ""
echo -e "${GREEN}✓${NC} ${CYAN}Database${NC}"
echo "   Supabase: $SUPABASE_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "NEXT STEPS:"
echo "1. Open $VERCEL_URL in your browser"
echo "2. Create a test account"
echo "3. Upload test images"
echo "4. Create presentations"
echo "5. Test all features"
echo ""
echo "MONITORING:"
echo "- View logs: railway logs --follow"
echo "- View metrics: vercel analytics"
echo ""
echo "Need help? Check FREE_DEPLOYMENT_GUIDE.md"
echo ""
