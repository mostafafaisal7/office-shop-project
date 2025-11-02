# FastAPI Internal Error Troubleshooting Guide

## 🔍 Quick Diagnosis Checklist

Follow these steps in order to identify and fix the issue:

---

## Step 1: Check Application Logs (MOST IMPORTANT)

### In cPanel Python App Manager:
1. Go to **Setup Python App**
2. Find your application
3. Click **Edit** or **View**
4. Click **View Logs** or **Log** button
5. Look for error messages

### Via SSH:
```bash
# Check error logs
tail -50 ~/logs/stderr.log
tail -50 ~/logs/yourusername.com.error.log

# Check access logs
tail -50 ~/logs/access.log
```

**Common errors you might see:**
- Import errors
- Database connection errors
- Missing dependencies
- Permission errors
- Syntax errors

---

## Step 2: Verify passenger_wsgi.py File

Make sure your `passenger_wsgi.py` file is correct:

```python
#!/usr/bin/env python3
import sys
import os

# Get the directory where this file is located
INTERP = os.path.join(os.environ['HOME'], 'virtualenv', 'fastapi_ecommerce-main', '3.11', 'bin', 'python3')

# Activate virtual environment
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add your application directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import FastAPI app
try:
    from app.main import app as application
    print("FastAPI app loaded successfully", file=sys.stderr)
except Exception as e:
    print(f"Error loading FastAPI app: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    raise
```

### Save this file:
```bash
# Location: ~/fastapi_ecommerce-main/passenger_wsgi.py
```

---

## Step 3: Check Python Version

```bash
cd ~/fastapi_ecommerce-main

# Check available Python versions
ls -la ~/virtualenv/

# Activate virtual environment
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# Verify Python version (should be 3.8+)
python --version

# Test if app loads
python -c "from app.main import app; print('SUCCESS: App imported')"
```

---

## Step 4: Verify Dependencies

```bash
cd ~/fastapi_ecommerce-main
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# Install/update all dependencies
pip install -r requirements.txt

# Verify key packages
pip list | grep -E "fastapi|uvicorn|pydantic|sqlalchemy"
```

---

## Step 5: Test Database Connection

```bash
cd ~/fastapi_ecommerce-main
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# Test database connection
python << 'EOF'
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")

try:
    from app.core.database import database
    print("✓ Database import successful")
except Exception as e:
    print(f"✗ Database import failed: {e}")
    import traceback
    traceback.print_exc()
EOF
```

---

## Step 6: Check File Permissions

```bash
cd ~/fastapi_ecommerce-main

# Set correct permissions
chmod 755 .
chmod 755 app
chmod -R 755 app/static
chmod 644 passenger_wsgi.py
chmod 644 .env
chmod 644 requirements.txt

# Verify owner
ls -la passenger_wsgi.py
ls -la .env
```

---

## Step 7: Verify .env File

Check your `.env` file has all required variables:

```bash
cat ~/fastapi_ecommerce-main/.env
```

**Required variables:**
```bash
DATABASE_URL=mysql+aiomysql://user:pass@localhost:3306/dbname
SYNC_DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/dbname
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_FRONTEND_URL=https://your-admin.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
SECRET_KEY=your_secret_key_here
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000
```

---

## Step 8: Test Application Manually

```bash
cd ~/fastapi_ecommerce-main
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# Try running the app manually
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# In another terminal, test if it works:
curl http://localhost:8000/docs
```

If manual test works but cPanel doesn't, it's a configuration issue.

---

## Step 9: Check Python App Configuration in cPanel

In cPanel Python App Manager, verify:

```
Python Version: 3.11 (or whatever you have)
Application Root: fastapi_ecommerce-main (or full path)
Application URL: api.yourdomain.com
Application Startup File: passenger_wsgi.py
Application Entry Point: application
```

---

## Step 10: Restart Everything

```bash
# 1. Restart Python application in cPanel
# Go to Setup Python App → Click Restart

# 2. If using Apache proxy, restart Apache
# In cPanel: Home → Restart Services → Apache

# 3. Clear any cache
rm -rf ~/fastapi_ecommerce-main/__pycache__
rm -rf ~/fastapi_ecommerce-main/app/__pycache__
find ~/fastapi_ecommerce-main -type d -name __pycache__ -exec rm -rf {} +
```

---

## Common Error Solutions

### Error: "No module named 'app'"

**Solution:**
```bash
# Make sure app directory exists
ls -la ~/fastapi_ecommerce-main/app/

# Make sure __init__.py exists
touch ~/fastapi_ecommerce-main/app/__init__.py
```

### Error: "No module named 'fastapi'"

**Solution:**
```bash
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate
pip install fastapi uvicorn
```

### Error: "Can't connect to MySQL server"

**Solution:**
```bash
# Verify database credentials
mysql -u your_db_user -p -h localhost your_db_name

# If connection works, update .env with correct credentials
```

### Error: "Permission denied"

**Solution:**
```bash
chmod -R 755 ~/fastapi_ecommerce-main
chown -R yourusername:yourusername ~/fastapi_ecommerce-main
```

### Error: "Address already in use"

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill it if needed
kill -9 <PID>
```

---

## Alternative: Run with Screen (If Python App Fails)

If cPanel Python App doesn't work, use this workaround:

```bash
# Install screen if not available
# (usually pre-installed)

# Start a screen session
screen -S fastapi

# Activate virtual environment
cd ~/fastapi_ecommerce-main
source venv/bin/activate

# Run FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2

# Detach from screen: Press Ctrl+A then D
# Reattach later: screen -r fastapi
```

Then set up Apache proxy as described in the main guide.

---

## Get Detailed Error Information

Create a test endpoint to see what's wrong:

```bash
# Create test.py in your app directory
cat > ~/fastapi_ecommerce-main/test_passenger.py << 'EOF'
import sys
import os

print("Python Version:", sys.version)
print("Python Path:", sys.executable)
print("Working Directory:", os.getcwd())
print("Environment Variables:")
for key in ['DATABASE_URL', 'BASE_URL', 'FRONTEND_URL']:
    print(f"  {key}: {os.getenv(key, 'NOT SET')}")

try:
    from app.main import app
    print("\n✓ SUCCESS: FastAPI app loaded")
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
EOF

# Run the test
python ~/fastapi_ecommerce-main/test_passenger.py
```

---

## Emergency Fallback: Simple Test App

If nothing works, test with a minimal FastAPI app:

```python
# Create ~/fastapi_ecommerce-main/passenger_wsgi_simple.py
from fastapi import FastAPI

application = FastAPI()

@application.get("/")
def read_root():
    return {"status": "FastAPI is working!"}

@application.get("/health")
def health_check():
    return {"status": "healthy"}
```

Update cPanel Python App to use `passenger_wsgi_simple.py` instead. If this works, the issue is with your main app configuration.

---

## 📝 Debug Checklist

- [ ] Checked application logs (most important!)
- [ ] Verified passenger_wsgi.py exists and is correct
- [ ] Python version is 3.8 or higher
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] Database connection works
- [ ] File permissions are correct (755 for directories, 644 for files)
- [ ] .env file has all required variables
- [ ] No syntax errors in code
- [ ] Virtual environment activated
- [ ] Application restarted in cPanel
- [ ] __pycache__ directories cleared

---

## 🆘 Still Not Working?

### Collect this information:

1. **Full error message from logs**:
   ```bash
   tail -100 ~/logs/stderr.log
   ```

2. **Python version**:
   ```bash
   python --version
   ```

3. **FastAPI app test**:
   ```bash
   python -c "from app.main import app; print('OK')"
   ```

4. **Directory structure**:
   ```bash
   ls -la ~/fastapi_ecommerce-main/
   ls -la ~/fastapi_ecommerce-main/app/
   ```

5. **Environment check**:
   ```bash
   source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate
   pip list
   ```

Share these details and we can troubleshoot further!

---

## Quick Fix Command Sequence

Run these commands in order:

```bash
# 1. Navigate to app directory
cd ~/fastapi_ecommerce-main

# 2. Activate virtual environment
source ~/virtualenv/fastapi_ecommerce-main/3.11/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Fix permissions
chmod 755 .
chmod -R 755 app
chmod 644 passenger_wsgi.py

# 5. Clear cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null

# 6. Test app import
python -c "from app.main import app; print('✓ App loads successfully')"

# 7. Check logs
tail -50 ~/logs/stderr.log
```

Then restart your Python app in cPanel.

---

**Most common cause**: Missing dependencies or incorrect passenger_wsgi.py file.
**Quick fix**: Follow Step 2 and Step 4 above, then restart.
