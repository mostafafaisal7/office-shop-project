import requests
import json

def test_admin_phone_login():
    url = "http://127.0.0.1:8000/auth/admin/login"
    
    # Test data with admin phone number
    test_data = {
        "phone": "01303151830",  # User ID 1 - Admin role
        "password": "*%#789Sal"  # Test password
    }
    
    print("Testing admin phone number login...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Admin phone login successful!")
        else:
            print("❌ Admin phone login failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_customer_phone_login():
    url = "http://127.0.0.1:8000/auth/customer/login"
    
    # Test data with customer phone number
    test_data = {
        "phone": "01999888777",  # User ID 6 - Test Customer we created
        "password": "testpass123"  # Known password
    }
    
    print("\nTesting customer phone number login...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Customer phone login successful!")
        else:
            print("❌ Customer phone login failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_admin_phone_login()
    test_customer_phone_login()
