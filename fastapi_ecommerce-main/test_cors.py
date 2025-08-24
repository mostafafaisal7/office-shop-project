#!/usr/bin/env python3
"""
Test script to verify CORS is working
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_cors_preflight():
    """Test CORS preflight request"""
    print("Testing CORS preflight request...")
    
    headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
    }
    
    try:
        response = requests.options(f"{BASE_URL}/auth/register", headers=headers)
        print(f"CORS Preflight Status Code: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            cors_headers = response.headers
            if 'access-control-allow-origin' in cors_headers:
                print("✅ CORS is properly configured")
                return True
            else:
                print("❌ CORS headers missing")
                return False
        else:
            print(f"❌ CORS preflight failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"CORS Test Error: {e}")
        return False

def test_actual_request():
    """Test actual request with CORS headers"""
    print("\nTesting actual request with CORS...")
    
    headers = {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
    }
    
    register_data = {
        "name": "CORS Test User",
        "email": "corstest@example.com",
        "phone": "01712345680",
        "password": "testpass123",
        "confirm_password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data, headers=headers)
        print(f"Request Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if 'access-control-allow-origin' in response.headers:
            print("✅ CORS headers present in response")
            return True
        else:
            print("❌ CORS headers missing in response")
            return False
            
    except Exception as e:
        print(f"Request Error: {e}")
        return False

def main():
    print("🚀 Testing CORS configuration...\n")
    
    preflight_success = test_cors_preflight()
    request_success = test_actual_request()
    
    print("\n" + "="*50)
    print("CORS TEST RESULTS:")
    print(f"Preflight Request: {'✅ PASS' if preflight_success else '❌ FAIL'}")
    print(f"Actual Request: {'✅ PASS' if request_success else '❌ FAIL'}")
    
    if preflight_success and request_success:
        print("\n🎉 CORS IS WORKING!")
        print("Frontend should now be able to connect to the backend.")
    else:
        print("\n❌ CORS NEEDS FIXING")

if __name__ == "__main__":
    main()
