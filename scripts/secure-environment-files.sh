#!/bin/bash

# 🔒 Secure Environment Files Script
# Removes hardcoded secrets from environment files and creates secure templates

set -e

echo "🔒 Securing Environment Files"
echo "============================="

# Function to backup and secure a file
secure_file() {
    local file="$1"
    local backup_dir="_archive/insecure-env-files"
    
    if [ -f "$file" ]; then
        echo "📁 Securing $file..."
        
        # Create backup directory if it doesn't exist
        mkdir -p "$backup_dir"
        
        # Move original file to archive
        mv "$file" "$backup_dir/$(basename $file).$(date +%Y%m%d_%H%M%S).backup"
        echo "   ✅ Moved to $backup_dir"
        
        # Create secure template
        local template_file="${file}.template"
        if [ ! -f "$template_file" ]; then
            echo "   📝 Creating secure template: $template_file"
            create_secure_template "$file" "$template_file"
        fi
    else
        echo "   ⚠️  File $file not found, skipping..."
    fi
}

# Function to create a secure template
create_secure_template() {
    local original_file="$1"
    local template_file="$2"
    
    cat > "$template_file" << 'EOF'
# 🔒 SECURE ENVIRONMENT TEMPLATE
# This file contains placeholder values for environment variables
# Copy this file and replace placeholders with actual values
# NEVER commit actual secrets to version control

# =============================================================================
# SECURITY WARNING
# =============================================================================
# This template was created to replace an insecure environment file
# that contained hardcoded secrets. Please:
# 1. Replace all placeholder values with actual secrets
# 2. Ensure all secrets are at least 32 characters long
# 3. Use a secure secret management system in production
# 4. Never commit files with actual secrets to version control

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL=postgresql://username:secure_password@host:5432/database?ssl=true

# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_secure_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_secure_supabase_service_role_key_here

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# =============================================================================
# NEXTAUTH CONFIGURATION
# =============================================================================
NEXTAUTH_SECRET=your_super_secure_nextauth_secret_at_least_32_characters_long
NEXTAUTH_URL=https://your-domain.com

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NEXT_PUBLIC_APP_NAME=AICRM
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com

# =============================================================================
# EXTERNAL SERVICES (Optional)
# =============================================================================
RINGCENTRAL_CLIENT_ID=your_ringcentral_client_id
RINGCENTRAL_CLIENT_SECRET=your_ringcentral_client_secret
RINGCENTRAL_SERVER=https://platform.ringcentral.com

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# =============================================================================
# FEATURE FLAGS
# =============================================================================
NEXT_PUBLIC_ENABLE_SAMPLE_DATA=false
NEXT_PUBLIC_ENABLE_PDF_EXPORT=true

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=info
LOG_DATABASE_QUERIES=false
DEBUG_MODE=false
EOF
}

# List of insecure environment files to secure
INSECURE_FILES=(
    ".env.k3s"
    ".env.local.hetzner-gardenos"
    "config/hetzner_db_connection.env"
)

echo "🔍 Checking for insecure environment files..."

for file in "${INSECURE_FILES[@]}"; do
    secure_file "$file"
done

# Update .gitignore to prevent future commits of sensitive files
echo ""
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# 🔒 Security: Environment files with secrets
.env.local
.env.production
.env.k3s
.env.*.local
config/hetzner_db_connection.env
**/secrets.env
**/*.secret
**/*.key
**/private.env

# 🔒 Security: Backup files with potential secrets
_archive/insecure-env-files/
EOF

echo "   ✅ Updated .gitignore with security patterns"

# Create a security checklist
echo ""
echo "📋 Creating security checklist..."
cat > "SECURITY_CHECKLIST.md" << 'EOF'
# 🔒 Security Checklist

## Before Production Deployment

### Environment Security
- [ ] All environment files use secure templates
- [ ] No hardcoded secrets in source code
- [ ] All secrets are at least 32 characters long
- [ ] Production uses HTTPS URLs only
- [ ] Database connections use SSL
- [ ] Environment variables are properly validated

### Authentication & Authorization
- [ ] No development authentication bypasses
- [ ] Password hashing uses bcrypt
- [ ] JWT secrets are secure and unique
- [ ] Session management is properly implemented
- [ ] Input validation on all endpoints

### API Security
- [ ] All API endpoints use parameterized queries
- [ ] Input validation and sanitization implemented
- [ ] CORS properly configured (no wildcards)
- [ ] Rate limiting implemented
- [ ] Security headers added to responses

### Infrastructure Security
- [ ] Security validation script passes
- [ ] Vulnerability scans completed
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery tested
- [ ] Security documentation updated

## Security Validation Commands

```bash
# Run security validation
node scripts/validate-security.js

# Check for secrets in git history
git secrets --scan-history

# Run dependency vulnerability check
npm audit

# Check for outdated packages
npm outdated
```

## Emergency Response

If a security issue is discovered:
1. Immediately rotate all affected credentials
2. Review access logs for suspicious activity
3. Update all affected systems
4. Document the incident and response
5. Review and update security procedures
EOF

echo "   ✅ Created SECURITY_CHECKLIST.md"

echo ""
echo "🎉 Environment files secured successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Review and complete the SECURITY_CHECKLIST.md"
echo "2. Replace placeholder values in .env templates with actual secrets"
echo "3. Run 'node scripts/validate-security.js' to verify security compliance"
echo "4. Test the application with the new environment configuration"
echo ""
echo "⚠️  Remember: Never commit files with actual secrets to version control!"
