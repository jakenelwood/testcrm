#!/bin/bash

# 🧹 Project Restructure Script - "Simple but no simpler"
# Reorganizes the CRM project into a clean, maintainable structure

set -e

echo "🧹 Starting CRM Project Restructure"
echo "==================================="

# Create the new clean structure
mkdir -p _archive
mkdir -p database/{schema,migrations,docs}

echo "📁 Creating clean directory structure..."

# Move database-related files to proper location
echo "🗄️ Organizing database files..."
mv schema_*.sql database/schema/ 2>/dev/null || true
mv *_schema*.sql database/schema/ 2>/dev/null || true
mv deploy_*.sh database/migrations/ 2>/dev/null || true
mv fix_*.sql database/schema/ 2>/dev/null || true
mv verify_*.js database/migrations/ 2>/dev/null || true
mv test_hetzner_connection.js database/migrations/ 2>/dev/null || true

# Move documentation to proper location
echo "📚 Organizing documentation..."
mv plan docs/ 2>/dev/null || true
mv *.md docs/ 2>/dev/null || true
mv docs/plan docs/database/ 2>/dev/null || true

# Archive unnecessary root-level clutter
echo "🗂️ Archiving unnecessary files..."

# Archive old boilerplate and duplicates
mv boilerplate-* _archive/ 2>/dev/null || true
mv crm _archive/ 2>/dev/null || true
mv superseded _archive/ 2>/dev/null || true

# Archive development artifacts
mv *_index.txt _archive/ 2>/dev/null || true
mv codebase-indexes _archive/ 2>/dev/null || true
mv testing _archive/ 2>/dev/null || true
mv templates _archive/ 2>/dev/null || true

# Archive Python environments and scripts
mv ringcentral-env _archive/ 2>/dev/null || true
mv rc-venv _archive/ 2>/dev/null || true
mv python-csv-service _archive/ 2>/dev/null || true
mv dialer _archive/ 2>/dev/null || true

# Archive test files and logs
mv test_*.* _archive/ 2>/dev/null || true
mv *test*.py _archive/ 2>/dev/null || true
mv *test*.js _archive/ 2>/dev/null || true
mv *.json _archive/ 2>/dev/null || true
mv UserTestLogs _archive/ 2>/dev/null || true
mv Challenges-Overcome _archive/ 2>/dev/null || true
mv Hetzner _archive/ 2>/dev/null || true

# Archive old scripts and configs
mv *.sh _archive/ 2>/dev/null || true
mv *.py _archive/ 2>/dev/null || true
mv scripts _archive/ 2>/dev/null || true
mv vercel.json _archive/ 2>/dev/null || true

# Archive CSV and document files
mv *.csv _archive/ 2>/dev/null || true
mv *.docx _archive/ 2>/dev/null || true
mv *.txt _archive/ 2>/dev/null || true

# Archive old supabase files (we're using Hetzner now)
mv supabase _archive/ 2>/dev/null || true

# Archive old node_modules (keep the one in frontend-next-files)
mv node_modules _archive/ 2>/dev/null || true
mv package*.json _archive/ 2>/dev/null || true

# Now move the clean frontend structure to root
echo "🚀 Moving clean application to root..."

# Copy essential files from frontend-next-files to root
cp -r frontend-next-files/app .
cp -r frontend-next-files/components .
cp -r frontend-next-files/lib .
cp -r frontend-next-files/types .
cp -r frontend-next-files/hooks .
cp -r frontend-next-files/contexts .
cp -r frontend-next-files/config .
cp -r frontend-next-files/styles .
cp -r frontend-next-files/public .

# Copy configuration files
cp frontend-next-files/package.json .
cp frontend-next-files/package-lock.json .
cp frontend-next-files/next.config.js .
cp frontend-next-files/tailwind.config.js .
cp frontend-next-files/tsconfig.json .
cp frontend-next-files/postcss.config.js .
cp frontend-next-files/components.json .
cp frontend-next-files/.env.local.template .
cp frontend-next-files/middleware.ts .
cp frontend-next-files/README.md .

# Copy essential hidden files
cp frontend-next-files/.eslintrc.json . 2>/dev/null || true
cp frontend-next-files/eslint.config.mjs . 2>/dev/null || true
cp frontend-next-files/next-env.d.ts . 2>/dev/null || true

# Archive the old frontend-next-files directory
mv frontend-next-files _archive/

echo "🧹 Cleaning up application structure..."

# Remove test and debug components that aren't needed
rm -rf app/admin 2>/dev/null || true
rm -rf app/pricing 2>/dev/null || true
rm -rf app/leads 2>/dev/null || true
rm -rf app/reference 2>/dev/null || true

# Clean up components
rm -rf components/test-* 2>/dev/null || true
rm -rf components/DeveloperNotes 2>/dev/null || true
rm -rf components/toast-demo.tsx 2>/dev/null || true

# Remove backup files
rm -f app/layout.tsx.bak* 2>/dev/null || true

# Clean up lib directory
rm -rf lib/hooks 2>/dev/null || true  # We have hooks/ at root level

echo "📝 Creating project documentation..."

# Create a clean README
cat > README.md << 'EOF'
# 🏢 Insurance CRM System

A comprehensive, multi-tenant insurance CRM built with Next.js and PostgreSQL.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.template .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Database**: PostgreSQL (Hetzner) with comprehensive schema
- **UI**: Tailwind CSS + shadcn/ui components
- **Integration**: RingCentral for telephony

## 📁 Project Structure

```
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                # Utilities and database client
├── types/              # TypeScript definitions
├── database/           # Database schema and migrations
├── docs/               # Project documentation
└── _archive/           # Archived files
```

## 🗄️ Database

- **Multi-tenant**: Organizations → Locations → Users
- **Complete workflow**: Lead → Client → Win-back
- **Comprehensive data**: Vehicles, Drivers, Properties, Quotes
- **Follow-up system**: Automated scheduling and hibernation

## 📚 Documentation

See `docs/` directory for detailed documentation.
EOF

# Create database README
cat > database/README.md << 'EOF'
# 🗄️ Database Documentation

## Schema Version: 2.1.0

### Current Features
- Multi-tenant architecture (Organizations → Locations → Users)
- Complete customer lifecycle (Lead → Client → Win-back)
- Comprehensive insurance data (Vehicles, Drivers, Properties)
- Advanced quote management system
- Follow-up scheduling and automation

### Files
- `schema/` - Database schema definitions
- `migrations/` - Migration scripts and tools
- `docs/` - Detailed documentation

### Connection
```
Host: 5.161.110.205:5432
Database: crm
Schema Version: 2.1.0
```
EOF

echo "✅ Project restructure complete!"
echo ""
echo "📊 New Structure Summary:"
echo "  📁 Clean application structure at root level"
echo "  🗄️ Database files organized in database/"
echo "  📚 Documentation consolidated in docs/"
echo "  🗂️ Unnecessary files archived in _archive/"
echo ""
echo "🎯 Next Steps:"
echo "  1. Review the new structure"
echo "  2. Update .env.local with your settings"
echo "  3. Run 'npm install' to set up dependencies"
echo "  4. Run 'npm run dev' to start development"
echo ""
echo "🧹 The project is now 'as simple as possible, but no simpler'!"
