# End-to-End Test Script - Instructions

## Overview

This comprehensive test script validates the entire flow of your Office Shop application:
1. ✅ User Authentication
2. ✅ Canvas Design Creation
3. ✅ Add Items to Cart (with design data)
4. ✅ Check for Duplicate Cart Items
5. ✅ Checkout and Order Creation
6. ✅ Admin Zip Download
7. ✅ Zip Content Validation

## Prerequisites

### 1. Install Python Dependencies

```bash
pip install requests
```

### 2. Start Your Servers

**Backend (FastAPI):**
```bash
cd fastapi_ecommerce-main
uvicorn app.main:app --reload --port 8000
```

**Frontend (Next.js):**
```bash
cd frontend/customized_product_ecommerce-main
npm run dev
```

### 3. Database Setup

Ensure your database has:
- At least one product (ID: 1) with variations
- Test user account (or the script will use test mode)
- Admin account (or the script will use test mode)

## Running the Tests

### Basic Usage

```bash
python test_end_to_end.py
```

This will use default values:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- User email: `test@example.com`
- Admin email: `admin@example.com`

### Custom Configuration

```bash
python test_end_to_end.py \
  --backend-url http://localhost:8000 \
  --frontend-url http://localhost:3000 \
  --user-email your.email@example.com \
  --admin-email admin@example.com
```

### Using Test Configuration File

```bash
# Copy and edit the config
cp test_config.example.json test_config.json
nano test_config.json

# Run with config
python test_end_to_end.py --config test_config.json
```

## What the Script Tests

### 1. User Authentication (Step 1)
- **Tests:** OTP request and verification
- **Fallback:** Uses test mode if OTP fails
- **Output:** User token and user ID
- **Debug:** Shows authentication status

### 2. Admin Authentication (Step 1.5)
- **Tests:** Admin OTP request and verification
- **Fallback:** Uses test mode if OTP fails
- **Output:** Admin token and admin ID
- **Debug:** Shows admin authentication status

### 3. Canvas Design Creation (Step 2)
- **Tests:** Creating a design with Fabric.js canvas data
- **Creates:** Sample design with text and rectangle
- **Output:** Customization option ID
- **Debug:** Shows canvas data structure and design metadata

### 4. Add Items to Cart (Step 3)
- **Tests:** Adding multiple items with different sizes
- **Default:** Adds 2 items (M: qty 2, L: qty 1)
- **Validates:** Design data is attached to cart items
- **Output:** Cart item IDs
- **Debug:** Shows each cart API call and response

### 5. Check for Duplicates (Step 4)
- **Tests:** Fetches cart and checks for duplicate items
- **Detection:** Finds duplicates by product_id + size + customization_id
- **Output:** List of duplicates (if any)
- **Debug:** Shows detailed comparison of duplicate items

**THIS IS THE CRITICAL TEST FOR YOUR DUPLICATE CART ISSUE!**

### 6. Checkout (Step 5)
- **Tests:** Complete checkout flow with design data
- **Validates:** Design snapshots are preserved in order
- **Output:** Order ID and order item IDs
- **Debug:** Shows checkout payload and order response

### 7. Admin Zip Download (Step 6)
- **Tests:** Admin downloading order design package
- **Validates:**
  - ZIP file is valid
  - Contains expected files (README, manifest, canvas_data)
  - JSON files are valid
  - Canvas data matches original design
- **Output:** ZIP file analysis
- **Debug:** Shows ZIP contents and validates each file

## Understanding the Output

### Success Indicators
```
✅ Green checkmarks = Test passed
ℹ️  Blue info = Informational message
⚠️  Yellow warning = Warning (test continues)
❌ Red X = Test failed
```

### Log Symbols
```
🚀 = Entry point
📦 = Cart operations
🔧 = Item operations
🔄 = Sync operations
🌐 = API calls
🔍 = Debug data
```

### Sample Output
```
================================================================================
STEP: 1. USER AUTHENTICATION
================================================================================

ℹ️  Requesting OTP for test@example.com
✅ OTP sent successfully
ℹ️  Verifying OTP...
✅ User logged in successfully (ID: 1)
🔍 User Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

✅ User Authentication: Authenticated as user ID 1 (took 1.23s)
```

## Analyzing Results

### Test Report Files

After each run, the script generates:
- `test_report_YYYYMMDD_HHMMSS.json` - Detailed JSON report

### Report Structure
```json
{
  "timestamp": "2025-10-29T10:30:00",
  "summary": {
    "total": 7,
    "passed": 7,
    "failed": 0,
    "success_rate": 100.0
  },
  "results": [
    {
      "step": "User Login",
      "success": true,
      "message": "Authenticated as user ID 1",
      "details": {"user_id": 1},
      "duration": 1.23
    }
  ]
}
```

## Debugging Duplicate Cart Items

If Step 4 fails (duplicates found), the output will show:

```
❌ DUPLICATE FOUND: 1_M_123
🔍 Original Item:
{
  "id": 45,
  "product_id": 1,
  "size": "M",
  "quantity": 2,
  "customization_id": 123
}
🔍 Duplicate Item:
{
  "id": 46,
  "product_id": 1,
  "size": "M",
  "quantity": 2,
  "customization_id": 123
}
```

This tells you:
1. **What got duplicated:** Product 1, Size M, Customization 123
2. **How many times:** 2 cart items with same key
3. **Cart item IDs:** 45 and 46 (different database entries)

### Common Causes of Duplicates

1. **Race condition in addItemsFromQuantityPage:**
   - Loop calls addItem multiple times
   - Each call triggers syncWithServer
   - Server returns growing cart each time

2. **syncWithServer replacing state:**
   - Server returns ALL cart items
   - State is replaced completely
   - Previous local additions get re-added

3. **Backend duplicating items:**
   - POST /cart endpoint adds item without checking for existing
   - Same item added multiple times to database

## Test Modes

### Production Mode
- Uses real OTP authentication
- Requires email/SMS service configured
- Must retrieve OTP from email/database

### Test Mode (Fallback)
- Activated automatically if OTP fails
- Uses mock tokens
- Still tests all other functionality
- **Use this for CI/CD pipelines**

## Extending the Tests

### Add More Test Cases

Edit `test_end_to_end.py` and add new test methods:

```python
def test_my_custom_check(self) -> bool:
    """Test custom functionality"""
    self.log_step("X. MY CUSTOM TEST")
    start_time = time.time()

    try:
        # Your test logic here

        self.add_result("My Test", True, "Success message",
                       duration=time.time()-start_time)
        return True
    except Exception as e:
        self.add_result("My Test", False, f"Exception: {e}",
                       duration=time.time()-start_time)
        return False
```

Then add to `run_all_tests()`:
```python
self.test_my_custom_check()
```

### Modify Test Data

Change the default sizes/quantities in Step 3:

```python
sizes = [
    {"size": "S", "quantity": 1, "price": 23.00},
    {"size": "M", "quantity": 3, "price": 25.00},
    {"size": "L", "quantity": 2, "price": 27.00},
    {"size": "XL", "quantity": 1, "price": 29.00}
]
runner.test_add_to_cart(sizes)
```

## Troubleshooting

### Authentication Fails
- Check if backend is running on correct port
- Verify database has user accounts
- Check OTP service is configured
- Use test mode for development

### Design Creation Fails
- Verify product_id exists in database
- Check user has permission to create designs
- Verify backend /products/users/me/options endpoint

### Cart Addition Fails
- Check cart API endpoint is accessible
- Verify customization_id is valid
- Check design_canvas_data format

### Checkout Fails
- Verify shipping_method_id and payment_method_id exist
- Check shipping_address_id format
- Verify all cart items have valid data

### Admin Zip Download Fails
- Check admin authentication
- Verify order_id and order_item_id exist
- Check order has design data
- Verify admin has permission to download

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install requests

      - name: Start Backend
        run: |
          cd fastapi_ecommerce-main
          pip install -r requirements.txt
          uvicorn app.main:app --reload --port 8000 &
          sleep 10

      - name: Run E2E Tests
        run: python test_end_to_end.py --backend-url http://localhost:8000
```

## Support

If tests fail:
1. Check console output for specific error
2. Review test_report_*.json for details
3. Check browser console (for frontend issues)
4. Check FastAPI logs (for backend issues)
5. Review database state

## Next Steps

After running tests:
1. Review the report file
2. Check for any failures
3. If duplicates found, review the debug logs we added earlier
4. Fix issues in the code
5. Re-run tests to verify fixes

**For duplicate cart issues, cross-reference this test output with the browser console logs from the debug logging we added in the previous commit!**
