import requests
import json

# Test the separate login endpoints
base_url = "http://127.0.0.1:8000"

def test_admin_login():
    """Test admin login endpoint"""
    print("Testing Admin Login Endpoint...")
    
    # Test with invalid credentials first
    admin_data = {
        "email": "admin@test.com",
        "password": "wrongpassword"
    }
    
    response = requests.post(f"{base_url}/auth/admin/login", json=admin_data)
    print(f"Admin login (invalid): Status {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_customer_login():
    """Test customer login endpoint"""
    print("Testing Customer Login Endpoint...")
    
    # Test with invalid credentials first
    customer_data = {
        "email": "customer@test.com", 
        "password": "wrongpassword"
    }
    
    response = requests.post(f"{base_url}/auth/customer/login", json=customer_data)
    print(f"Customer login (invalid): Status {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_general_login():
    """Test general login endpoint"""
    print("Testing General Login Endpoint...")
    
    # Test with invalid credentials first
    general_data = {
        "email": "user@test.com",
        "password": "wrongpassword"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=general_data)
    print(f"General login (invalid): Status {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_endpoints_exist():
    """Test that all endpoints exist and return proper error messages"""
    print("Testing Endpoint Availability...")
    
    endpoints = [
        "/auth/admin/login",
        "/auth/customer/login", 
        "/auth/login",
        "/auth/admin/login/verify-otp",
        "/auth/customer/login/verify-otp",
        "/auth/login/verify-otp"
    ]
    
    for endpoint in endpoints:
        try:
            # Send empty request to check if endpoint exists
            response = requests.post(f"{base_url}{endpoint}", json={})
            print(f"{endpoint}: Status {response.status_code} - Available")
        except Exception as e:
            print(f"{endpoint}: Error - {str(e)}")
    
    print()

if __name__ == "__main__":
    print("=== Testing Separate Login System ===\n")
    
    test_endpoints_exist()
    test_admin_login()
    test_customer_login()
    test_general_login()
    
    print("=== Test Complete ===")
