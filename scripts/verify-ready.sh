#!/bin/bash

# =============================================================================
# COSMFOLIO - DEPLOYMENT READINESS CHECKER
# =============================================================================
# Verifies everything is ready for deployment
# Usage: bash scripts/verify-ready.sh
# =============================================================================

set -e

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║   COSMFOLIO - DEPLOYMENT READINESS CHECK          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# ========== SYSTEM CHECKS ==========
echo -e "${BLUE}System Requirements:${NC}"
echo "————————————————————————————"

node --version > /dev/null 2>&1
check "Node.js installed"

python3 --version > /dev/null 2>&1
check "Python 3 installed"

git --version > /dev/null 2>&1
check "Git installed"

# ========== CLI TOOLS ==========
echo ""
echo -e "${BLUE}Deployment Tools:${NC}"
echo "————————————————————————————"

railway --version > /dev/null 2>&1
check "Railway CLI installed"

vercel --version > /dev/null 2>&1
check "Vercel CLI installed"

# ========== PROJECT STRUCTURE ==========
echo ""
echo -e "${BLUE}Project Structure:${NC}"
echo "————————————————————————————"

[ -d backend ] && check "Backend directory exists" || check "Backend directory exists"
[ -d frontend ] && check "Frontend directory exists" || check "Frontend directory exists"
[ -f backend/main.py ] && check "Backend main.py exists" || check "Backend main.py exists"
[ -f frontend/package.json ] && check "Frontend package.json exists" || check "Frontend package.json exists"
[ -f backend/requirements.txt ] && check "Backend requirements.txt exists" || check "Backend requirements.txt exists"

# ========== DEPENDENCIES ==========
echo ""
echo -e "${BLUE}Dependencies:${NC}"
echo "————————————————————————————"

cd backend
pip freeze | grep -q "fastapi" && check "Backend dependencies installed" || check "Backend dependencies installed"
cd ..

cd frontend
npm list > /dev/null 2>&1
check "Frontend dependencies installed"
cd ..

# ========== CONFIGURATION ==========
echo ""
echo -e "${BLUE}Configuration Files:${NC}"
echo "————————————————————————————"

[ -f .env.example ] && check ".env.example exists" || check ".env.example exists"
[ -f backend/.env.example ] && check "Backend .env.example exists" || check "Backend .env.example exists"
[ -f frontend/.env.example ] && check "Frontend .env.example exists" || check "Frontend .env.example exists"

# ========== GIT SETUP ==========
echo ""
echo -e "${BLUE}Git Configuration:${NC}"
echo "————————————————————————————"

[ -d .git ] && check "Git repository initialized" || check "Git repository initialized"

git remote get-url origin > /dev/null 2>&1
check "GitHub remote configured" || warning "GitHub remote not configured (add with: git remote add origin <url>)"

# ========== SCRIPTS ==========
echo ""
echo -e "${BLUE}Deployment Scripts:${NC}"
echo "————————————————————————————"

[ -f scripts/setup.sh ] && check "Setup script exists" || check "Setup script exists"
[ -f scripts/deploy-all.sh ] && check "Deploy-all script exists" || check "Deploy-all script exists"
[ -f scripts/deploy-backend.sh ] && check "Deploy-backend script exists" || check "Deploy-backend script exists"
[ -f scripts/deploy-frontend.sh ] && check "Deploy-frontend script exists" || check "Deploy-frontend script exists"
[ -f scripts/verify-ready.sh ] && check "Verify script exists" || check "Verify script exists"

# ========== API HEALTH ==========
echo ""
echo -e "${BLUE}Backend Health:${NC}"
echo "————————————————————————————"

# Check if backend can import
cd backend
python3 -c "from main import app; print('ok')" > /dev/null 2>&1
check "Backend imports successfully" || warning "Backend import failed (run: pip install -r requirements.txt)"
cd ..

# ========== BUILD CHECK ==========
echo ""
echo -e "${BLUE}Build Readiness:${NC}"
echo "————————————————————————————"

cd frontend
npm run build > /dev/null 2>&1
check "Frontend builds successfully" || warning "Frontend build failed"
cd ..

# ========== SUMMARY ==========
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║                  SUMMARY                          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "Checks passed: ${GREEN}$PASSED${NC}/$TOTAL"

if [ $FAILED -gt 0 ]; then
    echo -e "Checks failed: ${RED}$FAILED${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
fi

echo ""
echo "Pass rate: $PASS_RATE%"
echo ""

if [ $PASS_RATE -eq 100 ]; then
    echo -e "${GREEN}✅ READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "Next step:"
    echo "  bash scripts/deploy-all.sh"
    exit 0
elif [ $PASS_RATE -ge 90 ]; then
    echo -e "${YELLOW}⚠️  MOSTLY READY${NC}"
    echo ""
    echo "Minor issues to fix before deployment."
    exit 1
else
    echo -e "${RED}❌ NOT READY${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    exit 1
fi
