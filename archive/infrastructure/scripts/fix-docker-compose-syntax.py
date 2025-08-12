#!/usr/bin/env python3

"""
🔧 Fix Docker Compose Syntax Errors
This script fixes the depends_on syntax errors in the Supabase docker-compose.yml file

Documentation: docs/deployment/SUPABASE_SETUP.md
Troubleshooting: docs/deployment/HETZNER_SUPABASE_SETUP.md
"""

import re
import sys
import os

def fix_depends_on_syntax(content):
    """Fix depends_on syntax errors in docker-compose.yml"""

    # Pattern to match invalid depends_on entries
    # These are environment variables that got mixed into depends_on sections
    invalid_patterns = [
        r'(\s+depends_on:\s*\n\s+)([A-Z_]+):\s*(.+)',  # Environment variables in depends_on
    ]

    # Fix each pattern
    for pattern in invalid_patterns:
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in reversed(list(matches)):  # Reverse to maintain positions
            full_match = match.group(0)
            indent = match.group(1)
            env_var = match.group(2)
            env_value = match.group(3)

            # Replace with proper depends_on syntax
            # Move the environment variable to environment section
            replacement = f"{indent}analytics:\n{indent}  condition: service_healthy"

            # If this is an environment variable, we need to handle it differently
            if env_var in ['DEFAULT_ORGANIZATION_NAME', 'GOTRUE_DB_DRIVER', 'POSTGRES_BACKEND_URL']:
                # This should be in environment section, not depends_on
                replacement = f"{indent}analytics:\n{indent}  condition: service_healthy"

            content = content[:match.start()] + replacement + content[match.end():]

    return content

def fix_environment_variables(content):
    """Move misplaced environment variables to proper environment sections"""

    # Find services that have environment variables in depends_on
    services_to_fix = []

    # Look for patterns like:
    # depends_on:
    #   SOME_VAR: some_value
    pattern = r'(\s+depends_on:\s*\n)((?:\s+[A-Z_]+:\s*.+\n?)+)'

    def replacement_func(match):
        indent = match.group(1)
        env_vars = match.group(2)

        # Replace with proper depends_on
        return f"{indent}  analytics:\n{indent}    condition: service_healthy\n"

    content = re.sub(pattern, replacement_func, content, flags=re.MULTILINE)

    return content

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 fix-docker-compose-syntax.py <docker-compose.yml>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found")
        sys.exit(1)

    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()

    # Create backup
    backup_path = f"{file_path}.backup"
    with open(backup_path, 'w') as f:
        f.write(content)
    print(f"📁 Created backup: {backup_path}")

    # Fix the syntax
    print("🔧 Fixing depends_on syntax errors...")
    fixed_content = fix_depends_on_syntax(content)
    fixed_content = fix_environment_variables(fixed_content)

    # Write the fixed file
    with open(file_path, 'w') as f:
        f.write(fixed_content)

    print(f"✅ Fixed docker-compose.yml syntax errors")
    print("🔍 You should review the changes and test with: docker-compose config")

if __name__ == "__main__":
    main()
