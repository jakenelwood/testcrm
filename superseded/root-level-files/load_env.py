#!/usr/bin/env python3
import os
import json

def load_env_from_file(file_path='.env.local'):
    """Load environment variables from a .env file"""
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                key, value = line.split('=', 1)
                os.environ[key] = value
        print(f"Environment variables loaded from {file_path}")
        return True
    except Exception as e:
        print(f"Error loading environment variables: {e}")
        return False

def create_test_data():
    """Create test data files for call and SMS testing"""
    # Create test call data
    call_data = {
        "from": os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER', '+15551234567'),
        "to": "+15551234567"  # Replace with a real number for testing
    }
    
    with open('test_call_data.json', 'w') as f:
        json.dump(call_data, f)
    
    # Create test SMS data
    sms_data = {
        "from": os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER', '+15551234567'),
        "to": "+15551234567",  # Replace with a real number for testing
        "text": "This is a test message from Gonzigo CRM"
    }
    
    with open('test_sms_data.json', 'w') as f:
        json.dump(sms_data, f)
    
    print("Test data files created: test_call_data.json and test_sms_data.json")

def print_env_vars():
    """Print RingCentral environment variables"""
    print("RingCentral Environment Variables:")
    env_vars = [
        'RINGCENTRAL_CLIENT_ID',
        'RINGCENTRAL_SERVER',
        'RINGCENTRAL_USERNAME',
        'RINGCENTRAL_PASSWORD',
        'NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER'
    ]
    
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            # Mask sensitive information
            if var in ['RINGCENTRAL_CLIENT_ID', 'RINGCENTRAL_CLIENT_SECRET', 'RINGCENTRAL_PASSWORD']:
                print(f"{var}: {'*' * min(len(value), 8)}")
            else:
                print(f"{var}: {value}")
        else:
            print(f"{var}: Not set")

if __name__ == "__main__":
    load_env_from_file()
    print_env_vars()
    
    try:
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
        
        # Create test data files
        create_test_data()
        
        print("\nTo test the call functionality directly, run:")
        print(f"python {call_script_path} test_call_data.json")
        
        print("\nTo test the SMS functionality directly, run:")
        print(f"python {sms_script_path} test_sms_data.json")
        
    except ImportError:
        print("\nRingCentral SDK is NOT installed")
        print("Please install it using: pip install ringcentral")
