#!/usr/bin/env python
import os
import sys
import json
import subprocess

# Explicitly set environment variables
os.environ['RINGCENTRAL_CLIENT_ID'] = '9NGTe08cOAJakQ7ZSuJh01'
os.environ['RINGCENTRAL_CLIENT_SECRET'] = 'YOUR_CLIENT_SECRET'  # Replace with actual value
os.environ['RINGCENTRAL_SERVER'] = 'https://platform.ringcentral.com'
os.environ['RINGCENTRAL_USERNAME'] = 'YOUR_USERNAME'  # Replace with actual value
os.environ['RINGCENTRAL_EXTENSION'] = 'YOUR_EXTENSION'  # Replace with actual value
os.environ['RINGCENTRAL_PASSWORD'] = 'YOUR_PASSWORD'  # Replace with actual value
os.environ['NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER'] = '+15551234567'  # Replace with actual value

# Import the ringcentral module
try:
    from ringcentral import SDK
    print("RingCentral SDK imported successfully")
except ImportError:
    print("Error: Could not import RingCentral SDK.")
    print("Please make sure it's installed: pip install ringcentral")
    sys.exit(1)

# Initialize the SDK
def init_ringcentral():
    print(f"Initializing RingCentral SDK with:")
    print(f"  Client ID: {os.environ.get('RINGCENTRAL_CLIENT_ID')[:4]}...")
    print(f"  Server: {os.environ.get('RINGCENTRAL_SERVER')}")
    print(f"  Username: {os.environ.get('RINGCENTRAL_USERNAME')}")
    print(f"  Extension: {os.environ.get('RINGCENTRAL_EXTENSION')}")
    
    # Create SDK instance
    sdk = SDK(
        os.environ.get('RINGCENTRAL_CLIENT_ID'),
        os.environ.get('RINGCENTRAL_CLIENT_SECRET'),
        os.environ.get('RINGCENTRAL_SERVER')
    )
    
    # Get platform instance
    platform = sdk.platform()
    
    # Login
    try:
        print("Attempting to login...")
        platform.login(
            os.environ.get('RINGCENTRAL_USERNAME'),
            os.environ.get('RINGCENTRAL_EXTENSION'),
            os.environ.get('RINGCENTRAL_PASSWORD')
        )
        print("Login successful!")
        return platform
    except Exception as e:
        print(f"Login failed: {str(e)}")
        return None

# Test making a call
def test_call():
    platform = init_ringcentral()
    if not platform:
        print("Could not initialize RingCentral platform. Aborting test.")
        return
    
    from_number = os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER')
    to_number = '+15551234567'  # Replace with a real test number
    
    print(f"Attempting to make a call from {from_number} to {to_number}")
    
    try:
        # Make the call
        params = {
            'from': {'phoneNumber': from_number},
            'to': {'phoneNumber': to_number},
            'playPrompt': False
        }
        
        response = platform.post('/restapi/v1.0/account/~/extension/~/ring-out', params)
        result = response.json()
        
        print("Call initiated successfully!")
        print(f"Call ID: {result.get('id')}")
        print(f"Call Status: {result.get('status', {}).get('callStatus')}")
        return True
    except Exception as e:
        print(f"Call failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing direct RingCentral API call...")
    success = test_call()
    
    if success:
        print("\nTest completed successfully!")
    else:
        print("\nTest failed. Please check the error messages above.")
        
    print("\nNote: To use this with actual credentials, edit this file and replace:")
    print("  - YOUR_CLIENT_SECRET with your actual client secret")
    print("  - YOUR_USERNAME with your actual username")
    print("  - YOUR_EXTENSION with your actual extension")
    print("  - YOUR_PASSWORD with your actual password")
    print("  - The to_number in test_call() with an actual phone number to call") 