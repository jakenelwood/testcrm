#!/bin/bash

# 🔧 Environment Management Setup Helper
# Quick setup for environment file management system

set -e

echo "🔧 Environment File Management Setup"
echo "===================================="

# Get server details from user
read -p "Enter your server hostname (e.g., your-server.com): " SERVER_HOST
read -p "Enter your SSH username: " SERVER_USER
read -p "Enter server path for env files [/home/$SERVER_USER/crm-env-files]: " SERVER_PATH
SERVER_PATH=${SERVER_PATH:-"/home/$SERVER_USER/crm-env-files"}

read -p "Enter SSH key path [~/.ssh/id_ed25519]: " SSH_KEY
SSH_KEY=${SSH_KEY:-"~/.ssh/id_ed25519"}

# Create configuration file
cat > .env-management-config << EOF
# Environment File Management Configuration
# Source this file or add to your shell profile

export ENV_SERVER_HOST="$SERVER_HOST"
export ENV_SERVER_USER="$SERVER_USER"
export ENV_SERVER_PATH="$SERVER_PATH"
export SSH_KEY="$SSH_KEY"
EOF

echo "✅ Created .env-management-config"

# Add to shell profile
SHELL_PROFILE=""
if [ -f ~/.zshrc ]; then
    SHELL_PROFILE="~/.zshrc"
elif [ -f ~/.bashrc ]; then
    SHELL_PROFILE="~/.bashrc"
elif [ -f ~/.bash_profile ]; then
    SHELL_PROFILE="~/.bash_profile"
fi

if [ -n "$SHELL_PROFILE" ]; then
    echo ""
    read -p "Add configuration to $SHELL_PROFILE? (y/n): " ADD_TO_PROFILE
    if [ "$ADD_TO_PROFILE" = "y" ] || [ "$ADD_TO_PROFILE" = "Y" ]; then
        echo "" >> "$SHELL_PROFILE"
        echo "# CRM Environment File Management" >> "$SHELL_PROFILE"
        echo "source $(pwd)/.env-management-config" >> "$SHELL_PROFILE"
        echo "✅ Added to $SHELL_PROFILE"
        echo "Run 'source $SHELL_PROFILE' to load configuration"
    fi
fi

# Source the configuration for this session
source .env-management-config

echo ""
echo "🔧 Testing connection..."
if ./scripts/manage-env-files.sh test; then
    echo ""
    echo "🎉 Setup successful! You can now use:"
    echo "  ./scripts/manage-env-files.sh list"
    echo "  ./scripts/manage-env-files.sh download"
    echo "  ./scripts/manage-env-files.sh sync development"
else
    echo ""
    echo "⚠️  Connection test failed. Please check:"
    echo "  1. Server hostname and username"
    echo "  2. SSH key path and permissions"
    echo "  3. SSH key is added to server"
    echo ""
    echo "To add SSH key to server:"
    echo "  ssh-copy-id -i $SSH_KEY.pub $SERVER_USER@$SERVER_HOST"
fi

echo ""
echo "📚 See docs/ENVIRONMENT_FILE_MANAGEMENT.md for full documentation"
