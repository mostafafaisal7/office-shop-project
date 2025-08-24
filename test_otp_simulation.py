import requests
import json

def test_admin_otp_simulation():
    """Test OTP simulation for admin phone 01303151830"""
    print("=" * 60)
    print("🔐 TESTING OTP SIMULATION FOR ADMIN PHONE: 01303151830")
    print("=" * 60)
    
    # Step 1: Login with admin phone to trigger OTP
    login_url = "http://127.0.0.1:8000/auth/admin/login"
    login_data = {
        "phone": "01303151830",
        "password": "admin123"
    }
    
    print("Step 1: Requesting OTP...")
    print(f"URL: {login_url}")
    print(f"Data: {json.dumps(login_data, indent=2)}")
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ OTP request successful!")
            response_data = response.json()
            user_id = response_data.get("data", {}).get("userId")
            
            if user_id:
                print(f"\n📱 OTP has been sent to phone: 01303151830")
                print(f"👤 User ID: {user_id}")
                print(f"📧 User Email: {response_data.get('data', {}).get('user', {}).get('email')}")
                print(f"👑 User Role: {response_data.get('data', {}).get('user', {}).get('role')}")
                
                # Note: In a real scenario, you would receive the OTP via SMS
                print("\n" + "="*60)
                print("📲 SMS SIMULATION")
                print("="*60)
                print("To: +8801303151830")
                print("Message: Hello Admin, your admin login OTP is [OTP_CODE]")
                print("Note: The actual OTP is sent via GreenWeb SMS API")
                print("="*60)
                
                return True
            else:
                print("❌ No user ID in response")
                return False
        else:
            print("❌ OTP request failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_customer_otp_simulation():
    """Test OTP simulation for customer phone"""
    print("\n" + "=" * 60)
    print("🔐 TESTING OTP SIMULATION FOR CUSTOMER PHONE: 01712345679")
    print("=" * 60)
    
    # Step 1: Login with customer phone to trigger OTP
    login_url = "http://127.0.0.1:8000/auth/customer/login"
    login_data = {
        "phone": "01712345679",
        "password": "customer123"
    }
    
    print("Step 1: Requesting OTP...")
    print(f"URL: {login_url}")
    print(f"Data: {json.dumps(login_data, indent=2)}")
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ OTP request successful!")
            response_data = response.json()
            user_id = response_data.get("data", {}).get("userId")
            
            if user_id:
                print(f"\n📱 OTP has been sent to phone: 01712345679")
                print(f"👤 User ID: {user_id}")
                print(f"📧 User Email: {response_data.get('data', {}).get('user', {}).get('email')}")
                print(f"👑 User Role: {response_data.get('data', {}).get('user', {}).get('role')}")
                
                # Note: In a real scenario, you would receive the OTP via SMS
                print("\n" + "="*60)
                print("📲 SMS SIMULATION")
                print("="*60)
                print("To: +8801712345679")
                print("Message: Hello Verified User, your login OTP is [OTP_CODE]")
                print("Note: The actual OTP is sent via GreenWeb SMS API")
                print("="*60)
                
                return True
            else:
                print("❌ No user ID in response")
                return False
        else:
            print("❌ OTP request failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 OTP SIMULATION TESTING")
    print("This test simulates OTP sending to verify the SMS functionality")
    
    admin_result = test_admin_otp_simulation()
    customer_result = test_customer_otp_simulation()
    
    print("\n" + "=" * 60)
    print("📊 SIMULATION SUMMARY")
    print("=" * 60)
    print(f"Admin OTP (01303151830): {'✅ SUCCESS' if admin_result else '❌ FAILED'}")
    print(f"Customer OTP (01712345679): {'✅ SUCCESS' if customer_result else '❌ FAILED'}")
    
    if admin_result and customer_result:
        print("\n🎉 All OTP simulations successful!")
        print("📱 SMS messages would be sent via GreenWeb API in production")
    else:
        print("\n⚠️ Some OTP simulations failed - check the logs above")
