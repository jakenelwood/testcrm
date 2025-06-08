#!/bin/bash

# 🔧 Setup Environment Management Aliases
# Creates convenient aliases for daily environment management

echo "🔧 Setting up environment management aliases..."

# Determine shell profile
SHELL_PROFILE=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        SHELL_PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    fi
fi

if [ -z "$SHELL_PROFILE" ]; then
    echo "❌ Could not determine shell profile"
    exit 1
fi

echo "📝 Adding aliases to $SHELL_PROFILE"

# Create aliases section
cat >> "$SHELL_PROFILE" << 'EOF'

# 🚀 CRM Environment Management Aliases
alias env-start='cd ~/Dev/CRM-REPOSITORY/crm && ./scripts/start-session.sh'
alias env-end='cd ~/Dev/CRM-REPOSITORY/crm && ./scripts/end-session.sh'
alias env-switch='cd ~/Dev/CRM-REPOSITORY/crm && ./scripts/env-quick.sh switch'
alias env-status='cd ~/Dev/CRM-REPOSITORY/crm && ./scripts/env-quick.sh status'
alias env-sync='cd ~/Dev/CRM-REPOSITORY/crm && ./scripts/env-quick.sh sync'
alias env-list='cd ~/Dev/CRM-REPOSITORY/crm && ./scripts/env-quick.sh list'

# Quick CRM development
alias crm='cd ~/Dev/CRM-REPOSITORY/crm'
alias crm-dev='cd ~/Dev/CRM-REPOSITORY/crm && npm run dev'
alias crm-build='cd ~/Dev/CRM-REPOSITORY/crm && npm run build'

EOF

echo "✅ Aliases added to $SHELL_PROFILE"
echo ""
echo "🎯 Available aliases:"
echo "   env-start   - Start new development session"
echo "   env-end     - End session with backup"
echo "   env-switch  - Quick environment switch"
echo "   env-status  - Show current environment"
echo "   env-sync    - Download latest from server"
echo "   env-list    - List available environments"
echo "   crm         - Go to CRM directory"
echo "   crm-dev     - Start CRM development server"
echo "   crm-build   - Build CRM for production"
echo ""
echo "🔄 To use the aliases, run: source $SHELL_PROFILE"
echo "   Or restart your terminal"
