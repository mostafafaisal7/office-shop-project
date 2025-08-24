#!/usr/bin/env python3

import requests
import json

# Test admin login with phone number
def test_admin_phone_login():
    base_url = "http://localhost:8000"
    
    print("Testing Admin Phone Login...")
    print("=" * 50)
    
    # Test data
    admin_phone = "01303151830"
    admin_password = "admin123"
    
    # Test admin login with phone
    login_data = {
        "phone": admin_phone,
        "password": admin_password
    }
    
    try:
        print(f"1. Testing admin login with phone: {admin_phone}")
        response = requests.post(f"{base_url}/auth/admin/login", json=login_data)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ Admin phone login successful!")
            data = response.json()
            if data.get("data", {}).get("otp_required"):
                print("   📱 OTP required - SMS should be sent")
            else:
                print("   🔑 Direct login successful")
        else:
            print("   ❌ Admin phone login failed!")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection failed - make sure FastAPI server is running on localhost:8000")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    
    # Test admin login with email for comparison
    print("2. Testing admin login with email for comparison...")
    login_data_email = {
        "email": "admin@example.com",  # Assuming admin has this email
        "password": admin_password
    }
    
    try:
        response = requests.post(f"{base_url}/auth/admin/login", json=login_data_email)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ Admin email login successful!")
        else:
            print("   ❌ Admin email login failed!")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_admin_phone_login()
