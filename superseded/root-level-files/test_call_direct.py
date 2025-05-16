#!/usr/bin/env python3
import os
import json
import sys
import subprocess

def load_env_from_file(file_path='.env.local'):
    """Load environment variables from a .env file"""
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
        print(f"Environment variables loaded from {file_path}")
        return True
    except Exception as e:
        print(f"Error loading environment variables: {e}")
        return False

def print_env_vars():
    """Print RingCentral environment variables"""
    print("\nRingCentral Environment Variables:")
    env_vars = [
        'RINGCENTRAL_CLIENT_ID',
        'RINGCENTRAL_CLIENT_SECRET',
        'RINGCENTRAL_SERVER',
        'RINGCENTRAL_USERNAME',
        'RINGCENTRAL_EXTENSION',
        'RINGCENTRAL_PASSWORD',
        'NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER'
    ]
    
    for var in env_vars:
        value = os.environ.get(var)
        if value:
            # Mask sensitive information
            if var in ['RINGCENTRAL_CLIENT_ID', 'RINGCENTRAL_CLIENT_SECRET', 'RINGCENTRAL_PASSWORD']:
                print(f"  {var}: {'*' * min(len(value), 8)}")
            else:
                print(f"  {var}: {value}")
        else:
            print(f"  {var}: Not set")

def test_call():
    """Test making a call using the RingCentral Python script"""
    print("\nTesting RingCentral call functionality...")
    
    call_script_path = os.path.join('frontend-next-files', 'pages', 'api', 'ringcentral', 'call.py')
    
    if not os.path.exists(call_script_path):
        print(f"Error: call.py script not found at: {call_script_path}")
        return False
    
    # Create test data file with the provided phone number
    from_number = os.environ.get('NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER', '+15551234567')
    to_number = "+16127996380"  # The provided phone number
    
    print(f"Making call from {from_number} to {to_number}")
    
    call_data = {
        "from": from_number,
        "to": to_number
    }
    
    with open('test_call_data.json', 'w') as f:
        json.dump(call_data, f)
    
    # Try to find the Python executable in the virtual environment
    python_executable = 'python3'
    venv_paths = [
        os.path.join('rc-venv', 'bin', 'python'),
        os.path.join('ringcentral-env', 'bin', 'python')
    ]
    
    for venv_path in venv_paths:
        if os.path.exists(venv_path):
            python_executable = venv_path
            print(f"Using Python from virtual environment: {venv_path}")
            break
    
    # Run the call script
    try:
        result = subprocess.run(
            [python_executable, call_script_path, 'test_call_data.json'],
            capture_output=True,
            text=True,
            env=os.environ
        )
        
        print(f"Exit code: {result.returncode}")
        print(f"Output: {result.stdout}")
        
        if result.stderr:
            print(f"Error: {result.stderr}")
        
        if result.returncode == 0:
            try:
                output = json.loads(result.stdout)
                if output.get('success'):
                    print("Call initiated successfully!")
                    return True
                else:
                    print(f"Call failed: {output.get('error')}")
                    return False
            except json.JSONDecodeError:
                print("Failed to parse output as JSON")
                return False
        else:
            print("Call script failed")
            return False
    except Exception as e:
        print(f"Error running call script: {e}")
        return False

if __name__ == "__main__":
    print("RingCentral Direct Call Test")
    print("===========================")
    
    # Load environment variables
    load_env_from_file()
    print_env_vars()
    
    # Test making a call
    test_call()
    
    print("\nTest completed")
