#!/bin/bash

# Install GardenOS scripts to make them available system-wide
# Run this script with sudo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the absolute path of the scripts directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create bin directory in user's home if it doesn't exist
USER_BIN="$HOME/bin"
mkdir -p "$USER_BIN"

# Check if $USER_BIN is in PATH, add it if not
if [[ ":$PATH:" != *":$USER_BIN:"* ]]; then
    print_status "Adding $USER_BIN to your PATH..."
    echo 'export PATH="$HOME/bin:$PATH"' >> "$HOME/.bashrc"
    print_warning "You'll need to restart your terminal or run 'source ~/.bashrc' for the PATH change to take effect"
fi

# Create symbolic links for all scripts
print_status "Creating symbolic links for GardenOS scripts..."

for script in "$SCRIPT_DIR"/*.sh; do
    script_name=$(basename "$script")
    link_name="${script_name%.sh}"  # Remove .sh extension
    
    # Create symbolic link
    ln -sf "$script" "$USER_BIN/$link_name"
    print_success "Created link: $link_name -> $script"
done

print_success "All scripts are now available system-wide!"
print_status "You can run them from anywhere, for example: 'index-codebase'"

# If PATH was updated, remind user to reload shell
if [[ ":$PATH:" != *":$USER_BIN:"* ]]; then
    print_warning "Remember to run 'source ~/.bashrc' or restart your terminal to update your PATH"
fi