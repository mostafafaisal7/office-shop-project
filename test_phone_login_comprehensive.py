import requests
import json

def test_customer_phone_login():
    """Test customer login with phone number"""
    print("=" * 50)
    print("TESTING CUSTOMER PHONE LOGIN")
    print("=" * 50)
    
    url = "http://127.0.0.1:8000/auth/customer/login"
    
    # Test with a known customer phone number
    test_data = {
        "phone": "01712345679",  # User ID 3 - customer role
        "password": "customer123"  # Updated with correct password
    }
    
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Customer phone login successful!")
            return response.json()
        else:
            print("❌ Customer phone login failed!")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_admin_phone_login():
    """Test admin login with phone number"""
    print("\n" + "=" * 50)
    print("TESTING ADMIN PHONE LOGIN")
    print("=" * 50)
    
    url = "http://127.0.0.1:8000/auth/admin/login"
    
    # Test with the admin phone number you specified
    test_data = {
        "phone": "01303151830",  # User ID 1 - admin role
        "password": "admin123"  # Updated with correct password
    }
    
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Admin phone login successful!")
            return response.json()
        else:
            print("❌ Admin phone login failed!")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_email_login_customer():
    """Test customer email login to ensure it still works"""
    print("\n" + "=" * 50)
    print("TESTING CUSTOMER EMAIL LOGIN (Should still work)")
    print("=" * 50)
    
    url = "http://127.0.0.1:8000/auth/customer/login"
    
    test_data = {
        "email": "verified@example.com",  # User ID 3 - customer role
        "password": "customer123"  # Updated with correct password
    }
    
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Customer email login still works!")
            return response.json()
        else:
            print("❌ Customer email login broken!")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_general_login_endpoint():
    """Test the general login endpoint with phone"""
    print("\n" + "=" * 50)
    print("TESTING GENERAL LOGIN ENDPOINT WITH PHONE")
    print("=" * 50)
    
    url = "http://127.0.0.1:8000/auth/login"
    
    test_data = {
        "phone": "01712345679",  # Customer phone
        "password": "customer123"  # Updated with correct password
    }
    
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ General login with phone works!")
            return response.json()
        else:
            print("❌ General login with phone failed!")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("🔍 COMPREHENSIVE PHONE LOGIN TESTING")
    print("Testing all login endpoints to identify issues...")
    
    # Test all scenarios
    customer_phone_result = test_customer_phone_login()
    admin_phone_result = test_admin_phone_login()
    customer_email_result = test_email_login_customer()
    general_login_result = test_general_login_endpoint()
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Customer Phone Login: {'✅ PASS' if customer_phone_result else '❌ FAIL'}")
    print(f"Admin Phone Login: {'✅ PASS' if admin_phone_result else '❌ FAIL'}")
    print(f"Customer Email Login: {'✅ PASS' if customer_email_result else '❌ FAIL'}")
    print(f"General Phone Login: {'✅ PASS' if general_login_result else '❌ FAIL'}")
