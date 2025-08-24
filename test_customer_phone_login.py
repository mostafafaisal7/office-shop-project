#!/usr/bin/env python3

import requests
import json

# Test customer phone login
def test_customer_phone_login():
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Testing Customer Phone Login")
    print("=" * 50)
    
    # Test data - using a customer account
    phone = "01777888999"      # Test Customer Phone from database
    password = "testpass123"   # Known test password
    
    # Step 1: Test customer login with phone
    print(f"📱 Step 1: Testing customer login with phone: {phone}")
    
    login_data = {
        "phone": phone,
        "password": password
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/customer/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("data", {}).get("otpRequired"):
                user_id = data["data"]["userId"]
                print(f"✅ Login successful! OTP sent. User ID: {user_id}")
                
                # Step 2: Test OTP verification (you'll need to enter the actual OTP)
                print(f"\n📧 Step 2: Testing OTP verification")
                otp = input("Enter the OTP you received: ").strip()
                
                if otp:
                    otp_data = {
                        "userId": user_id,
                        "otp": otp
                    }
                    
                    otp_response = requests.post(
                        f"{base_url}/auth/customer/login/verify-otp",
                        json=otp_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    print(f"OTP Status Code: {otp_response.status_code}")
                    print(f"OTP Response: {json.dumps(otp_response.json(), indent=2)}")
                    
                    if otp_response.status_code == 200:
                        print("✅ OTP verification successful!")
                        return True
                    else:
                        print("❌ OTP verification failed!")
                        return False
                else:
                    print("⚠️ No OTP entered, skipping verification")
                    return True
            else:
                print("❌ Login failed - no OTP required response")
                return False
        else:
            print(f"❌ Login failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_generic_login_comparison():
    """Test the generic login endpoint for comparison"""
    base_url = "http://127.0.0.1:8000"
    
    print("\n🔄 Testing Generic Login Endpoint (for comparison)")
    print("=" * 50)
    
    phone = "01999888777"      # Test Customer from database
    password = "password123"   # Standard test password
    
    login_data = {
        "phone": phone,
        "password": password
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Generic Login Status Code: {response.status_code}")
        print(f"Generic Login Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Generic login also works")
        else:
            print("❌ Generic login failed")
            
    except Exception as e:
        print(f"❌ Generic login error: {e}")

if __name__ == "__main__":
    print("🚀 Customer Phone Login Test")
    print("Make sure the FastAPI server is running on http://127.0.0.1:8000")
    print()
    
    # Test customer-specific endpoint
    success = test_customer_phone_login()
    
    # Test generic endpoint for comparison
    test_generic_login_comparison()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Customer phone login test completed successfully!")
    else:
        print("⚠️ Customer phone login test had issues - check the logs above")
