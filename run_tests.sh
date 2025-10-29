#!/bin/bash

# Quick test runner script for Office Shop E2E tests

echo "======================================================================"
echo "Office Shop - End-to-End Test Runner"
echo "======================================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if requests library is installed
if ! python3 -c "import requests" &> /dev/null; then
    echo "⚠️  'requests' library not found. Installing..."
    pip3 install requests
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install requests library"
        exit 1
    fi
fi

echo "✅ Required libraries installed"
echo ""

# Default values
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
USER_EMAIL="test@example.com"
ADMIN_EMAIL="admin@example.com"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --user-email)
            USER_EMAIL="$2"
            shift 2
            ;;
        --admin-email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./run_tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --backend-url URL     Backend API URL (default: http://localhost:8000)"
            echo "  --frontend-url URL    Frontend URL (default: http://localhost:3000)"
            echo "  --user-email EMAIL    User email for testing (default: test@example.com)"
            echo "  --admin-email EMAIL   Admin email for testing (default: admin@example.com)"
            echo "  --help                Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if backend is running
echo "Checking if backend is running at $BACKEND_URL..."
if curl -s -f -o /dev/null "$BACKEND_URL/docs"; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend might not be running at $BACKEND_URL"
    echo "   Please start the backend with: cd fastapi_ecommerce-main && uvicorn app.main:app --reload"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if frontend is running
echo "Checking if frontend is running at $FRONTEND_URL..."
if curl -s -f -o /dev/null "$FRONTEND_URL"; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend might not be running at $FRONTEND_URL"
    echo "   Please start the frontend with: cd frontend/customized_product_ecommerce-main && npm run dev"
fi

echo ""
echo "======================================================================"
echo "Starting E2E Tests"
echo "======================================================================"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "User:     $USER_EMAIL"
echo "Admin:    $ADMIN_EMAIL"
echo "======================================================================"
echo ""

# Run the test script
python3 test_end_to_end.py \
    --backend-url "$BACKEND_URL" \
    --frontend-url "$FRONTEND_URL" \
    --user-email "$USER_EMAIL" \
    --admin-email "$ADMIN_EMAIL"

TEST_EXIT_CODE=$?

echo ""
echo "======================================================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Check the output above for details."
fi
echo "======================================================================"

exit $TEST_EXIT_CODE
