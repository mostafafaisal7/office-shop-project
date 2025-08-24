import requests

def send_sms(phone: str, message: str) -> bool:
    """
    Send SMS using GreenWeb SMS API
    """
    try:
        greenweburl = "http://api.greenweb.com.bd/api.php"
        token = "534913592117560223616100f6fae6d3890db3a911f294b4a643"
        
        data = {
            'token': token,
            'to': phone,
            'message': message
        }
        
        response = requests.post(url=greenweburl, data=data)
        
        # Log the response for debugging
        print(f"SMS API Response: {response.text}")
        
        # Check if SMS was sent successfully
        # You may need to adjust this based on GreenWeb's actual response format
        if response.status_code == 200:
            return True
        else:
            print(f"SMS sending failed with status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error sending SMS: {str(e)}")
        return False
