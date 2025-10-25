# How to Start the FastAPI Backend

## ⚠️ CRITICAL: Backend Must Be Running

**The 500 error you're seeing is because the backend API is not running!**

The frontend needs the FastAPI backend to be running on port 8000.

---

## Quick Start

```bash
# Navigate to backend directory
cd /home/user/office-shop-project/fastapi_ecommerce-main

# Install dependencies (first time only)
pip install -r requirements.txt

# If that fails, install minimum required packages:
pip install fastapi uvicorn sqlalchemy databases asyncpg python-dotenv passlib python-jose pydantic-settings

# Start the backend server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Verify Backend is Running

### Test 1: Check if port 8000 is listening
```bash
curl http://127.0.0.1:8000/products/?per_page=3
```

**Expected Output**: JSON with products data

### Test 2: Check process
```bash
ps aux | grep uvicorn
```

**Expected Output**: Should see uvicorn process running

### Test 3: Check port
```bash
lsof -i :8000
```

**Expected Output**: Should show Python/uvicorn listening on port 8000

---

## Common Issues

### Issue 1: "ModuleNotFoundError"
**Solution**: Install missing dependencies
```bash
cd /home/user/office-shop-project/fastapi_ecommerce-main
pip install -r requirements.txt
```

### Issue 2: "Port 8000 already in use"
**Solution**: Kill existing process
```bash
pkill -9 uvicorn
# or
lsof -ti:8000 | xargs kill -9
```

### Issue 3: "Connection refused"
**Solution**: Backend is not running, start it
```bash
cd /home/user/office-shop-project/fastapi_ecommerce-main
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Issue 4: Database errors
**Solution**: Check if database is set up
```bash
# Check if .env file exists
cat /home/user/office-shop-project/fastapi_ecommerce-main/.env

# Run migrations if needed
cd /home/user/office-shop-project/fastapi_ecommerce-main
alembic upgrade head
```

---

## Running Both Frontend and Backend

### Terminal 1 - Backend:
```bash
cd /home/user/office-shop-project/fastapi_ecommerce-main
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 - Frontend:
```bash
cd /home/user/office-shop-project/frontend/customized_product_ecommerce-main
npm run dev
```

---

## Backend Logs

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using StatReload
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Testing Backend Performance

```bash
# Test products endpoint
time curl -s http://127.0.0.1:8000/products/?per_page=3

# Should respond in < 10ms if backend is optimized
```

---

## Frontend Console Logging

With the new logging added, you'll see detailed performance metrics in the browser console:

```
🚀 [API] fetchProducts - Starting request...
📡 [API] URL: /api/products/
⏱️  [API] Fetch completed in 1250.45ms
📊 [API] Response status: 200
⏱️  [API] JSON parsing: 2.15ms
📦 [API] Data received: 3 products
✅ [API] fetchProducts completed in 1252.60ms - 3 products
```

This will help you identify:
- Network time (Fetch)
- Response time
- Parsing time
- Total time

---

## Performance Expectations

### With Backend Running:
| Metric | Expected Time |
|--------|---------------|
| Backend Response | < 10ms |
| Network (localhost) | < 1ms |
| JSON Parsing | < 2ms |
| Total API Call | < 15ms |

### Without Backend Running:
- You'll see **500 errors**
- Or **connection refused** errors
- Or **very long timeout** (30-60 seconds)

---

## Debugging Performance

### Check Console Logs:

1. Open Browser DevTools (F12)
2. Go to Console tab
3. Look for `[API]` logs
4. Check the timing for each phase:
   - If "Fetch" is slow (> 100ms): Backend issue
   - If "Parsing" is slow: Data size issue
   - If total time is slow but individual steps are fast: Multiple calls issue

### Check Network Tab:

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look at "Waiting (TTFB)" time:
   - < 20ms: Great (backend is fast)
   - 20-100ms: Good
   - 100-500ms: Slow (check backend)
   - > 500ms: Very slow (backend issue)
   - Timeout/Error: Backend not running

---

## Next Steps

1. **Start the backend** using the commands above
2. **Refresh your frontend** page
3. **Check console logs** for detailed timing
4. **Report** specific timing if still slow

---

**After starting the backend, your API calls should complete in < 20ms for 3 products!**
