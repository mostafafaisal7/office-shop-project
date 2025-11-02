#!/bin/bash

# FastAPI Connectivity Test Script
# This script tests if FastAPI is running and accessible

echo "=========================================="
echo "FastAPI Connectivity Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if uvicorn process is running
echo "Test 1: Check if FastAPI is running..."
if ps aux | grep -v grep | grep uvicorn > /dev/null; then
    echo -e "${GREEN}✓ FastAPI process found${NC}"
    ps aux | grep uvicorn | grep -v grep
else
    echo -e "${RED}✗ FastAPI process NOT found${NC}"
    echo "  Start it with:"
    echo "  cd ~/fastapi_ecommerce-main"
    echo "  source venv/bin/activate"
    echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000 &"
fi
echo ""

# Test 2: Check what's listening on port 8000
echo "Test 2: Check port 8000..."
if netstat -tlnp 2>/dev/null | grep :8000 > /dev/null || lsof -i :8000 2>/dev/null > /dev/null; then
    echo -e "${GREEN}✓ Something is listening on port 8000${NC}"
    netstat -tlnp 2>/dev/null | grep :8000 || lsof -i :8000 2>/dev/null
else
    echo -e "${RED}✗ Nothing listening on port 8000${NC}"
    echo "  FastAPI needs to be started"
fi
echo ""

# Test 3: Test localhost:8000 connectivity
echo "Test 3: Test localhost:8000 access..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ localhost:8000 is accessible${NC}"
    echo "  Trying to fetch /products/..."
    if curl -s http://localhost:8000/products/ | head -c 100; then
        echo ""
        echo -e "${GREEN}✓ /products/ endpoint works${NC}"
    fi
else
    echo -e "${RED}✗ localhost:8000 is NOT accessible${NC}"
    echo "  Check if FastAPI is running and listening on port 8000"
fi
echo ""

# Test 4: Test 127.0.0.1:8000 connectivity
echo "Test 4: Test 127.0.0.1:8000 access..."
if curl -s http://127.0.0.1:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 127.0.0.1:8000 is accessible${NC}"
else
    echo -e "${RED}✗ 127.0.0.1:8000 is NOT accessible${NC}"
fi
echo ""

# Test 5: Check if .htaccess exists in subdomain
echo "Test 5: Check .htaccess configuration..."
HTACCESS_LOCATIONS=(
    "$HOME/public_html/api/.htaccess"
    "$HOME/public_html/.htaccess"
    "$HOME/api/.htaccess"
)

FOUND_HTACCESS=false
for location in "${HTACCESS_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        echo -e "${GREEN}✓ Found .htaccess at: $location${NC}"
        if grep -q "RewriteRule.*8000" "$location"; then
            echo -e "${GREEN}  ✓ Contains proxy rule to port 8000${NC}"
        else
            echo -e "${YELLOW}  ⚠ Does NOT contain proxy rule to port 8000${NC}"
        fi
        FOUND_HTACCESS=true
        echo "  Content:"
        cat "$location"
        break
    fi
done

if [ "$FOUND_HTACCESS" = false ]; then
    echo -e "${YELLOW}⚠ No .htaccess found in common locations${NC}"
    echo "  You may need to create one for proxy configuration"
fi
echo ""

# Test 6: Check Python App configuration (if cPanel command is available)
echo "Test 6: Check virtual environment..."
VENV_LOCATIONS=(
    "$HOME/virtualenv/fastapi_ecommerce-main/3.11"
    "$HOME/virtualenv/fastapi_ecommerce-main/3.10"
    "$HOME/fastapi_ecommerce-main/venv"
)

for venv in "${VENV_LOCATIONS[@]}"; do
    if [ -d "$venv" ]; then
        echo -e "${GREEN}✓ Found virtualenv at: $venv${NC}"
        break
    fi
done
echo ""

# Test 7: Check passenger_wsgi.py
echo "Test 7: Check passenger_wsgi.py..."
if [ -f "$HOME/fastapi_ecommerce-main/passenger_wsgi.py" ]; then
    echo -e "${GREEN}✓ passenger_wsgi.py exists${NC}"
    if grep -q "from app.main import app" "$HOME/fastapi_ecommerce-main/passenger_wsgi.py"; then
        echo -e "${GREEN}  ✓ Contains correct import${NC}"
    else
        echo -e "${YELLOW}  ⚠ May not have correct import statement${NC}"
    fi
else
    echo -e "${RED}✗ passenger_wsgi.py NOT found${NC}"
    echo "  This is needed for cPanel Python App"
fi
echo ""

# Test 8: Check DNS resolution
echo "Test 8: Check DNS for api.yourdomain.com..."
echo -e "${YELLOW}⚠ Replace 'api.yourdomain.com' with your actual domain${NC}"
echo "  Run: nslookup api.yourdomain.com"
echo ""

# Test 9: Test from outside if domain is provided
echo "Test 9: Test domain access (if configured)..."
echo "  To test your domain, run:"
echo "  curl -v https://api.yourdomain.com/docs"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If all tests pass, your FastAPI is working locally."
echo "If domain still doesn't work, it's a proxy/routing issue."
echo ""
echo "Next steps:"
echo "1. Make sure FastAPI is running (Test 1)"
echo "2. Verify localhost:8000 works (Test 3)"
echo "3. Configure .htaccess for proxy (Test 5)"
echo "4. OR use cPanel Python App with passenger_wsgi.py (Test 7)"
echo ""
echo "For detailed help, see:"
echo "- FIX_DOMAIN_PROXY_ISSUE.md"
echo "- TROUBLESHOOT_INTERNAL_ERROR.md"
echo "=========================================="
