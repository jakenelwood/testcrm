#!/usr/bin/env python
import os
import sys
import json

# Check environment variables
print("RingCentral Environment Variables:")
print(f"RINGCENTRAL_CLIENT_ID: {os.environ.get('RINGCENTRAL_CLIENT_ID', 'Not set')}")
print(f"RINGCENTRAL_SERVER: {os.environ.get('RINGCENTRAL_SERVER', 'Not set')}")
print(f"RINGCENTRAL_USERNAME: {'Set' if os.environ.get('RINGCENTRAL_USERNAME') else 'Not set'}")
print(f"RINGCENTRAL_PASSWORD: {'Set' if os.environ.get('RINGCENTRAL_PASSWORD') else 'Not set'}")
print(f"NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER: {os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER', 'Not set')}")

try:
    # Import the RingCentral SDK
    from ringcentral import SDK
    print("\nRingCentral SDK is installed and importable")
    
    # Check if the call.py script exists
    call_script_path = os.path.join('frontend-next-files', 'pages', 'api', 'ringcentral', 'call.py')
    if os.path.exists(call_script_path):
        print(f"call.py script exists at: {call_script_path}")
    else:
        print(f"call.py script NOT found at: {call_script_path}")
    
    # Check if the sms.py script exists
    sms_script_path = os.path.join('frontend-next-files', 'pages', 'api', 'ringcentral', 'sms.py')
    if os.path.exists(sms_script_path):
        print(f"sms.py script exists at: {sms_script_path}")
    else:
        print(f"sms.py script NOT found at: {sms_script_path}")
    
except ImportError:
    print("\nRingCentral SDK is NOT installed")
    sys.exit(1)

print("\nTo test the call functionality directly, run:")
print(f"python {call_script_path} test_call_data.json")
print("\nTo test the SMS functionality directly, run:")
print(f"python {sms_script_path} test_sms_data.json")

# Create test data files
with open('test_call_data.json', 'w') as f:
    json.dump({
        'from': os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER', '+15551234567'),
        'to': '+15551234567'  # Replace with a real number for testing
    }, f)

with open('test_sms_data.json', 'w') as f:
    json.dump({
        'from': os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER', '+15551234567'),
        'to': '+15551234567',  # Replace with a real number for testing
        'text': 'This is a test SMS from the CRM system'
    }, f)

print("\nTest data files created: test_call_data.json and test_sms_data.json") 