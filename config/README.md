# 🔧 Configuration Files

This directory contains non-standard configuration files and temporary development files that don't belong at the project root.

## Files

### **Database Configuration**
- `hetzner_db_connection.env` - Hetzner database connection settings

### **Temporary Development Files**
- `temp_*.js` - Temporary configuration files for testing
- `temp_*.tsx` - Temporary component files for development

## Standard Configuration Files

The following configuration files remain at the project root following industry conventions:

- `.env.local.template` - Environment variable template
- `.gitignore` - Git ignore rules
- `package.json` - Node.js package configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - shadcn/ui components configuration
- `middleware.ts` - Next.js middleware

## Usage

Files in this directory are typically:
1. **Non-standard** - Don't follow typical project conventions
2. **Temporary** - Used during development but not permanent
3. **Environment-specific** - Specific to certain deployment environments
4. **Experimental** - Testing new configurations

Keep the project root clean by placing non-essential config files here.
