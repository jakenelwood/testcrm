#!/bin/bash

# Script to copy reference components from boilerplate to the new reference directory
# This organizes the components into a more structured format

# Base directories
SOURCE_DIR="crm/boilerplate-shadcn-pro-main"
TARGET_DIR="frontend-next-files/reference"

# Create necessary directories if they don't exist
mkdir -p "$TARGET_DIR/components/ui"
mkdir -p "$TARGET_DIR/components/layouts"
mkdir -p "$TARGET_DIR/components/templates"
mkdir -p "$TARGET_DIR/styles"

# Copy UI Components
echo "Copying UI components..."

# Card components
mkdir -p "$TARGET_DIR/components/ui/card"
cp -r "$SOURCE_DIR/components/card/"* "$TARGET_DIR/components/ui/card/"
echo "✓ Copied card components"

# Layout components
echo "Copying layout components..."
mkdir -p "$TARGET_DIR/components/layouts/sidebar"
cp -r "$SOURCE_DIR/components/sidebar/"* "$TARGET_DIR/components/layouts/sidebar/"

mkdir -p "$TARGET_DIR/components/layouts/navbar"
cp -r "$SOURCE_DIR/components/navbar/"* "$TARGET_DIR/components/layouts/navbar/"

mkdir -p "$TARGET_DIR/components/layouts/footer"
cp -r "$SOURCE_DIR/components/footer/"* "$TARGET_DIR/components/layouts/footer/"

mkdir -p "$TARGET_DIR/components/layouts/main"
cp -r "$SOURCE_DIR/components/layout/"* "$TARGET_DIR/components/layouts/main/"
echo "✓ Copied layout components"

# Template components
echo "Copying template components..."
mkdir -p "$TARGET_DIR/components/templates/dashboard"
cp -r "$SOURCE_DIR/components/dashboard/"* "$TARGET_DIR/components/templates/dashboard/"

mkdir -p "$TARGET_DIR/components/templates/auth"
cp -r "$SOURCE_DIR/components/auth/"* "$TARGET_DIR/components/templates/auth/"
cp -r "$SOURCE_DIR/components/auth-ui/"* "$TARGET_DIR/components/templates/auth/"

mkdir -p "$TARGET_DIR/components/templates/landing"
cp -r "$SOURCE_DIR/components/landing/"* "$TARGET_DIR/components/templates/landing/"

mkdir -p "$TARGET_DIR/components/templates/pricing"
cp -r "$SOURCE_DIR/components/pricing/"* "$TARGET_DIR/components/templates/pricing/"
echo "✓ Copied template components"

# Copy utility components
echo "Copying utility components..."
mkdir -p "$TARGET_DIR/components/ui/charts"
cp -r "$SOURCE_DIR/components/charts/"* "$TARGET_DIR/components/ui/charts/"

mkdir -p "$TARGET_DIR/components/ui/scrollbar"
cp -r "$SOURCE_DIR/components/scrollbar/"* "$TARGET_DIR/components/ui/scrollbar/"

mkdir -p "$TARGET_DIR/components/ui/audio"
cp -r "$SOURCE_DIR/components/audio/"* "$TARGET_DIR/components/ui/audio/"
echo "✓ Copied utility components"

# Copy individual components
echo "Copying individual components..."
cp "$SOURCE_DIR/components/MessageBox.tsx" "$TARGET_DIR/components/ui/"
cp "$SOURCE_DIR/components/MessageBoxChat.tsx" "$TARGET_DIR/components/ui/"
cp "$SOURCE_DIR/components/TextBlock.tsx" "$TARGET_DIR/components/ui/"
cp "$SOURCE_DIR/components/routes.tsx" "$TARGET_DIR/components/layouts/"
echo "✓ Copied individual components"

# Copy styles
echo "Copying styles..."
cp -r "$SOURCE_DIR/styles/"* "$TARGET_DIR/styles/" 2>/dev/null || echo "No styles directory found"
echo "✓ Copied styles"

# Create a component catalog file
echo "Creating component catalog..."
cat > "$TARGET_DIR/COMPONENT_CATALOG.md" << 'EOF'
# Component Catalog

This file provides a catalog of all the components available in the reference library.

## UI Components

### Card Components
- **CardMenu** - Context menu for cards
- **Card** - Basic card component with various styles

### Chart Components
- **AreaChart** - Area chart visualization
- **BarChart** - Bar chart visualization
- **LineChart** - Line chart visualization

### Audio Components
- **VolumeInput** - Audio volume control component

### Utility Components
- **MessageBox** - Component for displaying messages
- **MessageBoxChat** - Chat-specific message box
- **TextBlock** - Text block with formatting options
- **Scrollbar** - Custom scrollbar component

## Layout Components

### Sidebar
- **Sidebar** - Main application sidebar
- **SidebarCard** - Card component for sidebar

### Navbar
- **Navbar** - Top navigation bar

### Footer
- **Footer** - Page footer component

### Main Layout
- **Layout** - Main application layout

## Template Components

### Dashboard
- **Main Dashboard** - Main dashboard template
- **AI Assistant** - AI assistant interface
- **AI Chat** - Chat interface with AI
- **Settings** - User settings interface
- **Subscription** - Subscription management interface
- **Text-to-Speech** - Text to speech interface
- **Users List** - User management interface

### Authentication
- **Sign In** - Sign in form
- **Sign Up** - Sign up form
- **Forgot Password** - Password recovery form

### Landing
- **Hero** - Hero section for landing page
- **Features** - Features section for landing page

### Pricing
- **Pricing Plans** - Pricing plans display

## How to Use

To use a component from this catalog:

1. Find the component you need in this catalog
2. Locate it in the reference directory
3. Copy it to your working directory or import it directly
4. Customize as needed for your specific use case
EOF

echo "✓ Created component catalog"

echo "Done! Components have been copied to $TARGET_DIR"
