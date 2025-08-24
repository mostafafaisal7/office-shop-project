import requests
import json

# Test phone number login
def test_phone_login():
    url = "http://127.0.0.1:8000/auth/customer/login"
    
    # Test data with phone number from database
    test_data = {
        "phone": "01303151830",  # User ID 6 - testcustomer@example.com
        "password": "testpass123"  # Known test password
    }
    
    print("Testing phone number login...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Phone login successful!")
        else:
            print("❌ Phone login failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_email_login():
    url = "http://127.0.0.1:8000/auth/customer/login"
    
    # Test data with email from database
    test_data = {
        "email": "romlejegno@necub.com",  # User ID 3 - customer role
        "password": "passworD123"  # Common test password
    }
    
    print("\nTesting email login...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Email login successful!")
        else:
            print("❌ Email login failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_phone_login()
    test_email_login()
