#!/bin/bash

# =============================================================================
# COSMFOLIO - SETUP SCRIPT
# =============================================================================
# Prepares your environment for automated deployment
# Usage: bash setup.sh
# =============================================================================

set -e

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  COSMFOLIO - DEPLOYMENT SETUP                     ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check and install prerequisites
echo -e "${CYAN}STEP 1: Installing Prerequisites${NC}"
echo "=================================="

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"
else
    echo -e "${YELLOW}Installing Node.js...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Please install Node.js manually from https://nodejs.org"
    fi
    echo -e "${GREEN}✓${NC} Node.js installed"
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} $PYTHON_VERSION"
else
    echo -e "${YELLOW}Installing Python...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install python3
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y python3 python3-pip
    else
        echo "Please install Python manually from https://python.org"
    fi
    echo -e "${GREEN}✓${NC} Python installed"
fi

# Install Railway CLI
echo -e "${YELLOW}Installing Railway CLI...${NC}"
npm install -g @railway/cli
echo -e "${GREEN}✓${NC} Railway CLI installed"

# Install Vercel CLI
echo -e "${YELLOW}Installing Vercel CLI...${NC}"
npm install -g vercel
echo -e "${GREEN}✓${NC} Vercel CLI installed"

# Install Python dependencies
echo ""
echo -e "${CYAN}STEP 2: Installing Backend Dependencies${NC}"
echo "=================================="

if [ -f backend/requirements.txt ]; then
    cd backend
    pip install -q -r requirements.txt
    cd ..
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
fi

# Setup frontend dependencies
echo ""
echo -e "${CYAN}STEP 3: Installing Frontend Dependencies${NC}"
echo "=================================="

if [ -f frontend/package.json ]; then
    cd frontend
    npm install -q
    cd ..
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
fi

# Initialize Git
echo ""
echo -e "${CYAN}STEP 4: Setting up Git Repository${NC}"
echo "=================================="

if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✓${NC} Git repository initialized"
else
    echo -e "${GREEN}✓${NC} Git repository already initialized"
fi

# Create GitHub secrets template
echo ""
echo -e "${CYAN}STEP 5: Creating GitHub Secrets Template${NC}"
echo "=================================="

cat > .github/SECRETS_TEMPLATE.md << 'EOF'
# GitHub Secrets Setup

Add these secrets to your GitHub repository for automated deployment:

## Steps:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret below:

## Required Secrets:

### RAILWAY_TOKEN
- Get from: https://railway.app/account/tokens
- Copy your Railway token
- Paste in GitHub secret

### VERCEL_TOKEN
- Get from: https://vercel.com/account/tokens
- Create a new token (full access)
- Paste in GitHub secret

### VERCEL_ORG_ID
- Get from: https://vercel.com/account
- Find your org/team ID
- Paste in GitHub secret

### VERCEL_PROJECT_ID
- Get from: Vercel dashboard
- Click project → Settings → General
- Copy Project ID
- Paste in GitHub secret

## After setup:
- Every push to `main` branch will auto-deploy
- Check Actions tab to see deployment progress
EOF

echo -e "${GREEN}✓${NC} GitHub secrets template created"
echo "   See: .github/SECRETS_TEMPLATE.md"

# Make scripts executable
echo ""
echo -e "${CYAN}STEP 6: Setting Permissions${NC}"
echo "=================================="

chmod +x scripts/*.sh 2>/dev/null || true
echo -e "${GREEN}✓${NC} Scripts made executable"

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║          SETUP COMPLETE!                          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Create Supabase Project${NC}"
echo "   - Go to https://supabase.com"
echo "   - Create new project (free tier)"
echo "   - Note: URL, anon key, service role key"
echo ""
echo "2. ${YELLOW}Create Replicate Account${NC}"
echo "   - Go to https://replicate.com"
echo "   - Sign up and get API token"
echo "   - (Optional, uses mock mode if not provided)"
echo ""
echo "3. ${YELLOW}Prepare GitHub & Deploy${NC}"
echo "   - Push code to GitHub: git push origin main"
echo "   - Run deployment: bash scripts/deploy-all.sh"
echo ""
echo "4. ${YELLOW}Configure GitHub Secrets${NC}"
echo "   - Follow instructions in .github/SECRETS_TEMPLATE.md"
echo ""
echo -e "${CYAN}Quick Commands:${NC}"
echo ""
echo "  Deploy everything:  bash scripts/deploy-all.sh"
echo "  Deploy backend:     bash scripts/deploy-backend.sh"
echo "  Deploy frontend:    bash scripts/deploy-frontend.sh"
echo ""
echo "  Start local dev:    cd backend && uvicorn main:app --reload"
echo "  Check health:       curl http://localhost:8000/health"
echo ""
echo "Ready to deploy? Run:"
echo -e "${GREEN}  bash scripts/deploy-all.sh${NC}"
echo ""
