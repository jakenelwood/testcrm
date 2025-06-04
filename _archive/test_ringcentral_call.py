#!/usr/bin/env python3
import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables from .env.local
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env.local')
print(f"Loading environment variables from: {dotenv_path}")
load_dotenv(dotenv_path)

# Try to import the RingCentral SDK
try:
    from ringcentral import SDK
    print("\nRingCentral SDK is installed and importable")
    
    # RingCentral credentials
    RINGCENTRAL_CLIENT_ID = os.environ.get('RINGCENTRAL_CLIENT_ID')
    RINGCENTRAL_CLIENT_SECRET = os.environ.get('RINGCENTRAL_CLIENT_SECRET')
    RINGCENTRAL_SERVER = os.environ.get('RINGCENTRAL_SERVER', 'https://platform.ringcentral.com')
    RINGCENTRAL_USERNAME = os.environ.get('RINGCENTRAL_USERNAME')
    RINGCENTRAL_EXTENSION = os.environ.get('RINGCENTRAL_EXTENSION', '')
    RINGCENTRAL_PASSWORD = os.environ.get('RINGCENTRAL_PASSWORD')
    FROM_NUMBER = os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER')
    TO_NUMBER = "+16127996380"  # Your phone number
    
    print(f"\nRingCentral Configuration:")
    print(f"Client ID: {RINGCENTRAL_CLIENT_ID[:4]}..." if RINGCENTRAL_CLIENT_ID else "Client ID: Not set")
    print(f"Server: {RINGCENTRAL_SERVER}")
    print(f"Username: {RINGCENTRAL_USERNAME}")
    print(f"Extension: {RINGCENTRAL_EXTENSION}")
    print(f"From Number: {FROM_NUMBER}")
    print(f"To Number: {TO_NUMBER}")
    
    # Initialize the SDK
    print("\nInitializing RingCentral SDK...")
    rcsdk = SDK(RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER)
    platform = rcsdk.platform()
    
    # Authenticate
    print("\nAuthenticating with RingCentral...")
    try:
        platform.login(RINGCENTRAL_USERNAME, RINGCENTRAL_EXTENSION, RINGCENTRAL_PASSWORD)
        print("Authentication successful!")
    except Exception as auth_error:
        print(f"Authentication failed: {str(auth_error)}")
        sys.exit(1)
    
    # Make the call using RingOut API
    print(f"\nMaking call from {FROM_NUMBER} to {TO_NUMBER}")
    
    params = {
        'from': {'phoneNumber': FROM_NUMBER},
        'to': {'phoneNumber': TO_NUMBER},
        'playPrompt': False  # Set to True if you want to play a prompt
    }
    
    try:
        response = platform.post('/restapi/v1.0/account/~/extension/~/ring-out', params)
        result = response.json()
        
        print(f"\nCall initiated successfully!")
        print(f"Call ID: {result.get('id')}")
        print(f"Call status: {result.get('status', {}).get('callStatus')}")
        print(f"Full response: {json.dumps(result, indent=2)}")
    except Exception as call_error:
        print(f"\nError making call: {str(call_error)}")
        sys.exit(1)

except ImportError:
    print("\nRingCentral SDK is NOT installed")
    print("Please install it using: pip install ringcentral")
    sys.exit(1)
except Exception as e:
    print(f"\nError: {str(e)}")
    sys.exit(1)

print("\nTest completed")
