#!/bin/bash

# Clean up existing directory
rm -rf frontend-next-clean
mkdir -p frontend-next-clean
cd frontend-next-clean

# Create a new Next.js app with predefined answers
yes "n
y
n" | npx create-next-app@latest . --ts --tailwind --app --src-dir --import-alias "@/*" --eslint

# Install necessary dependencies
npm install @swc/helpers tailwindcss postcss autoprefixer --save-dev

# Create a clean next.config.js
cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
EOL

echo "Setup complete!" 